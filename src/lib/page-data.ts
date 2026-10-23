import { cache } from "react";
import { context } from "./auth";
import { getCommunity } from "./community";
// Request-scoped only: never share private data between requests.
export const getPageData = cache(async (articleId?: string) => {
  const { store, user } = await context(false);
  return getCommunity(store, user, articleId);
});
