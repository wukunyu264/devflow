import type { MetadataRoute } from "next";
import { Store } from "@/lib/store";
import { categories } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/community"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
    })),
  ];
  const store = new Store();
  for (let offset = 0; ; offset += 500) {
    const articles = await store.summaries(undefined, 500, offset);
    result.push(
      ...articles.map((article) => ({
        url: absoluteUrl(`/article/${article.id}`),
        lastModified: article.updated_at,
      })),
    );
    if (articles.length < 500) break;
  }
  return result;
}
