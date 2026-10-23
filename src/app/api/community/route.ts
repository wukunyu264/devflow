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
import { takeAuthAttempt } from "@/lib/rate-limit";
import { authFailure } from "@/lib/auth-errors";
import { getPublicCommunity, invalidatePublicCommunity } from "@/lib/public-data";

export const runtime = "nodejs";
export const dynamic = "auto";
class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code?: string,
  ) {
    super(message);
  }
}
const uuid = z.string("请输入有效的资源标识").uuid("资源标识格式无效");
const credentials = z.object({
  email: z.string("请输入邮箱地址").trim().toLowerCase().pipe(z.email("请输入有效的邮箱地址").max(254, "邮箱地址过长")),
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
function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: /[\u3400-\u9fff]/.test(error.issues[0].message) ? error.issues[0].message : "提交的内容格式无效，请检查后重试。" },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message, ...(error.code ? { code: error.code } : {}) },
      { status: error.status, headers: { "Cache-Control": "private, no-store" } },
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
export async function GET(request: NextRequest) {
  try {
    const { store, user } = await context();
    const articleId = request.nextUrl.searchParams.get("article");
    const id = articleId ? uuid.parse(articleId) : undefined;
    return NextResponse.json(user ? await getCommunity(store, user, id) : await getPublicCommunity(id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin) {
      let source: URL;
      try { source = new URL(origin); } catch { throw new HttpError("请求来源无效", 403); }
      if (!["http:", "https:"].includes(source.protocol) || source.host !== request.headers.get("host"))
        throw new HttpError("请求来源无效", 403);
    }
    const raw = await request.text();
    if (raw.length > 150000) throw new HttpError("请求内容过大", 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new HttpError("请求格式无效");
    }
    const action = z.string("请指定操作类型").min(1, "请指定操作类型").parse(body?.action);
    if (action === "login" || action === "register") {
      const input = credentials.parse(body);
      if (!(await takeAuthAttempt(input.email))) throw new HttpError("尝试次数过多，请 15 分钟后再试。", 429);
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
        if (result.error) {
          const problem = authFailure(action, result.error);
          // Only our allowlisted code/status enter logs, never email/password/JWT/provider text.
          console.warn("[DevFlow auth]", action, problem.code, problem.status);
          throw new HttpError(problem.message, problem.status, problem.code);
        }
        if (!result.data.session) {
          if (action === "register") invalidatePublicCommunity();
          return NextResponse.json({
            message: "注册申请已提交。如需验证，请查看邮箱（含垃圾邮件）；已有账号可直接登录。",
            confirmation: true,
          });
        }
        const session = result.data.session;
        const store = new Store(session.access_token);
        const profiles = await store.list<Profile>("profiles", {
          id: result.data.user!.id,
        });
        if (!profiles.length)
          await store.insert(
            "profiles",
            makeProfile(result.data.user!.id, input.name ?? "新朋友"),
          );
        await setSession(session.access_token, session.refresh_token);
      } else {
        const db = await localDatabase();
        if (action === "register") {
          if (
            db
              .prepare("SELECT user_id FROM credentials WHERE email = ?")
              .get(input.email)
          )
            throw new HttpError("注册请求暂时无法完成，请稍后重试或尝试登录。");
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
      if (action === "register") invalidatePublicCommunity();
      return NextResponse.json({ success: true });
    }
    if (action === "logout") {
      await logout();
      return NextResponse.json({ success: true });
    }
    const { user, store } = await context();
    if (action === "view") {
      const id = uuid.parse(body.id);
      if (user) await store.view(id, user.id);
      if (user) invalidatePublicCommunity();
      return NextResponse.json(user
        ? { success: true, counting: "signed_in_daily_deduplicated" }
        : { success: true, counted: false, reason: "anonymous" });
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
      invalidatePublicCommunity();
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
    invalidatePublicCommunity();
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
