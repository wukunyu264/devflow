import { cache } from "react";
import { context } from "./auth";
import { getCommunity } from "./community";
import { getPublicCommunity } from "./public-data";
// Identity is request-scoped. Only the anonymous branch shares public data.
export const getPageData = cache(async (articleId?: string) => {
  const { store, user } = await context(false);
  return user ? getCommunity(store, user, articleId) : getPublicCommunity(articleId);
});
