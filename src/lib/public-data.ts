import { createHash } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { getCommunity } from "./community";
import { backendConfig } from "./backend";

const tag = "devflow-public-community";
// Separate databases (including isolated test SQLite files) must not share entries.
const config = backendConfig();
const source = createHash("sha256").update(JSON.stringify([
  config.backend,
  config.backend === "supabase" ? config.url : process.env.LOCAL_DATA_DIR ?? "data",
])).digest("hex");
const snapshot = unstable_cache(
  async (articleId: string) => getCommunity(undefined, null, articleId || undefined),
  ["devflow-public-v1", source],
  { revalidate: 60, tags: [tag] },
);

// Only a fresh anonymous Store is used inside this cache. No JWT/cookies/private drafts.
export function getPublicCommunity(articleId?: string) {
  return snapshot(articleId ?? "");
}
export function invalidatePublicCommunity() {
  // Writes must be visible to the following GET, without serving stale deleted content.
  revalidateTag(tag, { expire: 0 });
}
