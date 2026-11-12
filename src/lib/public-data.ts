import { createHash } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { getCommunity } from "./community";
import { backendConfig } from "./backend";
import { Store } from "./store";
import { buildTopicGraph } from "./topic-graph";
import type { Article, Comment } from "./types";

const tag = "devflow-public-community";
// Separate databases (including isolated test SQLite files) must not share entries.
const config = backendConfig();
const source = createHash("sha256")
  .update(
    JSON.stringify([
      config.backend,
      config.backend === "supabase"
        ? config.url
        : (process.env.LOCAL_DATA_DIR ?? "data"),
    ]),
  )
  .digest("hex");
// Share the bounded feed/sidebar data across articles. Previously every article
// cache miss repeated the feed, author, like and follow queries.
const community = unstable_cache(
  async () => getCommunity(undefined, null),
  ["devflow-public-feed-v2", source],
  { revalidate: 60, tags: [tag] },
);
const snapshot = unstable_cache(
  async (articleId: string) => {
    if (process.env.DATA_TRACE === "1")
      console.info("[DevFlow data] community snapshot");
    const store = new Store();
    const [articles, comments] = await Promise.all([
      store.list<Article>(
        "articles",
        { id: articleId, status: "published" },
        1,
      ),
      store.list<Comment>("comments", { article_id: articleId }),
    ]);
    const article = articles[0] ?? null;
    return { article, comments: article ? comments : [] };
  },
  ["devflow-public-detail-v3", source],
  { revalidate: 60, tags: [tag] },
);

// Only a fresh anonymous Store is used inside this cache. No JWT/cookies/private drafts.
export async function getPublicCommunity(articleId?: string) {
  if (!articleId) return community();
  // Resolve sibling caches here: Next bypasses inner unstable_cache lookups
  // when they are invoked inside another cached function.
  const [base, detail] = await Promise.all([community(), snapshot(articleId)]);
  return { ...base, ...detail };
}
// Uses the same anonymous cache scope/invalidation as published articles.
// The homepage requests it only when its map approaches the viewport.
export const getPublicTopics = unstable_cache(
  async () => buildTopicGraph(await new Store().summaries(undefined, 120)),
  ["devflow-public-topics-v1", source],
  { revalidate: 60, tags: [tag] },
);
export function invalidatePublicCommunity() {
  // Writes must be visible to the following GET, without serving stale deleted content.
  revalidateTag(tag, { expire: 0 });
}
