import { Store, isCloud } from "./store";
import type {
  Article,
  Profile,
  Comment,
  Reaction,
  Follow,
  Community,
} from "./types";

export async function getCommunity(
  store = new Store(),
  user: Profile | null = null,
  articleId?: string,
): Promise<Community> {
  if (process.env.DATA_TRACE === "1") console.info("[DevFlow data] community snapshot");
  const [articles, detail, profiles, comments, likes, bookmarks, follows] =
    await Promise.all([
      store.summaries(user?.id),
      articleId ? store.list<Article>("articles", {id:articleId}, 1) : Promise.resolve([]),
      store.list<Profile>("profiles", {}, 200),
      store.list<Comment>("comments", articleId ? {article_id:articleId} : {}),
      store.list<Reaction>("likes"),
      user
        ? store.list<Reaction>("bookmarks", { user_id: user.id })
        : Promise.resolve([]),
      store.list<Follow>("follows"),
    ]);
  const visible = articles.filter(
    (a) => a.status === "published" || a.author_id === user?.id,
  );
  const ids = new Set(visible.map((a) => a.id));
  const article = detail.find(row => row.status === "published" || row.author_id === user?.id) ?? null;
  if (article) ids.add(article.id);
  return {
    article,
    articles: visible.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    profiles,
    comments: comments.filter((c) => ids.has(c.article_id)),
    likes: likes.filter((l) => ids.has(l.article_id)),
    bookmarks,
    follows,
    user,
    mode: isCloud ? "supabase" : "local",
  };
}
