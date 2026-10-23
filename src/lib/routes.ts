import { categories } from "./types";

export const validId = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
const simple = new Set(["community", "discover", "trending", "search", "bookmarks", "write", "login", "register", "dashboard", "about", "guidelines"]);
export function validPagePath(path: string[]) {
  if (path.length === 0) return true;
  if (path.length === 1) return simple.has(path[0]);
  if (path.length !== 2) return false;
  if (path[0] === "article" || path[0] === "user") return validId(path[1]);
  return path[0] === "category" && categories.some(category => category.slug === path[1]);
}
