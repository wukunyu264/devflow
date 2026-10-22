import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  context,
  logout,
  makeProfile,
  newLocalSession,
  passwordHash,
  passwordMatches,
  randomUUID,
  setSession,
} from "@/lib/auth";
import { cloudClient, isCloud, localDatabase, Store } from "@/lib/store";
import { getCommunity } from "@/lib/community";
import type { Article, Comment, Profile, Reaction, Follow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const uuid = z.string().uuid();
const credentials = z.object({
  email: z.email("请输入有效的邮箱地址").max(254),
  password: z.string().min(8, "密码至少需要 8 个字符").max(128),
  name: z.string().trim().min(2, "昵称至少 2 个字").max(24).optional(),
});
const articleSchema = z
  .object({
    id: uuid.optional(),
    title: z.string().trim().min(1, "请输入文章标题").max(120),
    content: z.string().trim().max(100000),
    excerpt: z.string().trim().max(250),
    category: z.enum([
      "frontend",
      "backend",
      "ai",
      "java",
      "python",
      "database",
      "tools",
      "architecture",
    ]),
    tags: z.array(z.string().trim().min(1).max(20)).max(4),
    cover: z.enum([
      "react",
      "ai",
      "typescript",
      "next",
      "css",
      "agent",
      "java",
      "python",
      "database",
      "git",
      "architecture",
      "terminal",
      "none",
    ]),
    status: z.enum(["published", "draft"]),
  })
  .superRefine((article, context) => {
    if (article.status === "published" && article.title.length < 4)
      context.addIssue({
        code: "custom",
        message: "发布时标题至少需要 4 个字",
        path: ["title"],
      });
    if (article.status === "published" && article.content.length < 20)
      context.addIssue({
        code: "custom",
        message: "发布时正文至少需要 20 个字",
        path: ["content"],
      });
  });
const loginAttempts = new Map<string, { count: number; until: number }>();
function rateLimit(key: string) {
  const now = Date.now();
  if (loginAttempts.size > 1000)
    for (const [k, v] of loginAttempts)
      if (v.until < now) loginAttempts.delete(k);
  const entry = loginAttempts.get(key);
  if (entry && entry.until > now && entry.count >= 12)
    throw new HttpError("尝试次数过多，请 15 分钟后再试。", 429);
  loginAttempts.set(key, {
    count: entry && entry.until > now ? entry.count + 1 : 1,
    until: entry && entry.until > now ? entry.until : now + 900000,
  });
}
function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0].message },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(
    "[DevFlow API]",
    error instanceof Error ? error.message : error,
  );
  return NextResponse.json(
    { error: "操作暂时无法完成，请稍后重试；请检查数据库连接与初始化配置。" },
    { status: 500 },
  );
}
export async function GET() {
  try {
    const { store, user } = await context();
    return NextResponse.json(await getCommunity(store, user), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host"))
      throw new HttpError("请求来源无效", 403);
    const raw = await request.text();
    if (raw.length > 150000) throw new HttpError("请求内容过大", 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new HttpError("请求格式无效");
    }
    const action = z.string().parse(body.action);
    if (action === "login" || action === "register") {
      const input = credentials.parse(body);
      rateLimit(input.email.toLowerCase());
      if (isCloud) {
        const client = cloudClient();
        const result =
          action === "register"
            ? await client.auth.signUp({
                email: input.email,
                password: input.password,
                options: { data: { name: input.name ?? "新朋友" } },
              })
            : await client.auth.signInWithPassword({
                email: input.email,
                password: input.password,
              });
        if (result.error)
          throw new HttpError(
            action === "login"
              ? "邮箱或密码错误，或邮箱尚未验证。"
              : "注册失败，邮箱可能已注册或请求过于频繁。",
          );
        if (!result.data.session)
          return NextResponse.json({
            message: "注册申请已提交，请查看邮箱中的验证邮件，验证后即可登录。",
            confirmation: true,
          });
        const session = result.data.session;
        await setSession(session.access_token, session.refresh_token);
        const store = new Store(session.access_token);
        const profiles = await store.list<Profile>("profiles", {
          id: result.data.user!.id,
        });
        if (!profiles.length)
          await store.insert(
            "profiles",
            makeProfile(result.data.user!.id, input.name ?? "新朋友"),
          );
      } else {
        const db = await localDatabase();
        if (action === "register") {
          if (
            db
              .prepare("SELECT user_id FROM credentials WHERE email = ?")
              .get(input.email)
          )
            throw new HttpError("这个邮箱已经注册，请直接登录。");
          const id = randomUUID();
          const hash = await passwordHash(input.password);
          db.exec("BEGIN");
          try {
            const p = makeProfile(id, input.name ?? "新朋友");
            db.prepare(
              "INSERT INTO profiles (id,name,bio,color,role,created_at) VALUES (?,?,?,?,?,?)",
            ).run(p.id, p.name, p.bio, p.color, p.role, p.created_at);
            db.prepare(
              "INSERT INTO credentials (user_id,email,password_hash) VALUES (?,?,?)",
            ).run(id, input.email.toLowerCase(), hash);
            db.exec("COMMIT");
          } catch (error) {
            db.exec("ROLLBACK");
            throw error;
          }
          await newLocalSession(id);
        } else {
          const row = db
            .prepare(
              "SELECT user_id, password_hash FROM credentials WHERE email = ?",
            )
            .get(input.email);
          if (
            !row ||
            !(await passwordMatches(
              input.password,
              row.password_hash as string,
            ))
          )
            throw new HttpError("邮箱或密码错误。", 401);
          await newLocalSession(row.user_id as string);
        }
      }
      return NextResponse.json({ success: true });
    }
    if (action === "logout") {
      await logout();
      return NextResponse.json({ success: true });
    }
    const { user, store } = await context();
    if (action === "view") {
      await store.view(uuid.parse(body.id));
      return NextResponse.json({ success: true });
    }
    if (!user) throw new HttpError("登录后即可参与社区。", 401);
    const now = new Date().toISOString();
    if (action === "saveArticle") {
      const input = articleSchema.parse(body.article);
      const existing = input.id
        ? (await store.list<Article>("articles", { id: input.id }))[0]
        : undefined;
      if (input.id && (!existing || existing.author_id !== user.id))
        throw new HttpError("你只能编辑自己的文章。", 403);
      const id = input.id ?? randomUUID();
      const data = {
        ...input,
        id,
        excerpt:
          input.excerpt ||
          input.content.replace(/[#*`>\[\]]/g, "").slice(0, 150),
        updated_at: now,
      };
      if (existing)
        await store.update("articles", data, { id, author_id: user.id });
      else
        await store.insert("articles", {
          ...data,
          author_id: user.id,
          created_at: now,
          views: 0,
          seed_likes: 0,
        });
      return NextResponse.json({ success: true, id });
    }
    if (action === "deleteArticle") {
      const id = uuid.parse(body.id);
      const article = (await store.list<Article>("articles", { id }))[0];
      if (!article || article.author_id !== user.id)
        throw new HttpError("你只能删除自己的文章。", 403);
      await store.delete("articles", { id, author_id: user.id });
    } else if (
      action === "like" ||
      action === "bookmark" ||
      action === "comment"
    ) {
      const id = uuid.parse(body.id);
      const article = (await store.list<Article>("articles", { id }))[0];
      if (!article || article.status !== "published")
        throw new HttpError("文章不存在或尚未发布。", 404);
      if (action === "comment") {
        const content = z
          .string()
          .trim()
          .min(1, "请输入评论内容")
          .max(1000, "评论最多 1000 字")
          .parse(body.content);
        await store.insert("comments", {
          id: randomUUID(),
          article_id: id,
          user_id: user.id,
          content,
          created_at: now,
        });
      } else {
        const table = action === "like" ? "likes" : "bookmarks";
        const filters = { article_id: id, user_id: user.id };
        const existing = await store.list<Reaction>(table, filters);
        if (existing.length) await store.delete(table, filters);
        else
          await store.insert(table, {
            ...filters,
            id: randomUUID(),
            created_at: now,
          });
      }
    } else if (action === "deleteComment") {
      const id = uuid.parse(body.id);
      const comment = (await store.list<Comment>("comments", { id }))[0];
      if (!comment || comment.user_id !== user.id)
        throw new HttpError("你只能删除自己的评论。", 403);
      await store.delete("comments", { id, user_id: user.id });
    } else if (action === "follow") {
      const id = uuid.parse(body.id);
      if (id === user.id) throw new HttpError("无需关注自己。");
      if (!(await store.list<Profile>("profiles", { id })).length)
        throw new HttpError("作者不存在。", 404);
      const filters = { author_id: id, user_id: user.id };
      if ((await store.list<Follow>("follows", filters)).length)
        await store.delete("follows", filters);
      else
        await store.insert("follows", {
          ...filters,
          id: randomUUID(),
          created_at: now,
        });
    } else if (action === "updateProfile") {
      const data = z
        .object({
          name: z.string().trim().min(2).max(24),
          bio: z.string().trim().max(160),
          role: z.string().trim().max(30),
        })
        .parse(body.profile);
      await store.update("profiles", data, { id: user.id });
    } else throw new HttpError("未知操作");
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
