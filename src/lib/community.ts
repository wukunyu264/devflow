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
): Promise<Community> {
  const [articles, profiles, comments, likes, bookmarks, follows] =
    await Promise.all([
      store.list<Article>("articles"),
      store.list<Profile>("profiles"),
      store.list<Comment>("comments"),
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
  return {
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
