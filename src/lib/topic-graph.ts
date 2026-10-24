import type { ArticleSummary, Category } from "./types";

export type TopicNode = {
  id: string;
  label: string;
  count: number;
  category: Category;
  articleIds: string[];
};
export type TopicGraph = {
  nodes: TopicNode[];
  links: { source: string; target: string; count: number }[];
  articles: { id: string; title: string; category: Category }[];
  articleCount: number;
  tagCount: number;
  sampleLimit: number;
};

// Only published summaries enter the public graph. Repeated/case-variant tags
// count once per article; edges mean co-occurrence, not inferred similarity.
export function buildTopicGraph(
  summaries: Pick<
    ArticleSummary,
    "id" | "title" | "tags" | "category" | "status"
  >[],
  sampleLimit = 120,
): TopicGraph {
  const articles = summaries
    .filter((article) => article.status === "published")
    .slice(0, sampleLimit);
  const nodes = new Map<string, TopicNode>();
  const edges = new Map<
    string,
    { source: string; target: string; count: number }
  >();
  for (const article of articles) {
    const tags = new Map<string, string>();
    for (const value of article.tags.slice(0, 4)) {
      const label = value.normalize("NFKC").trim().slice(0, 20);
      if (label) tags.set(label.toLowerCase(), label);
    }
    const ids = [...tags.keys()].sort();
    for (const id of ids) {
      const node = nodes.get(id) ?? {
        id,
        label: tags.get(id)!,
        count: 0,
        category: article.category,
        articleIds: [],
      };
      node.count += 1;
      node.articleIds.push(article.id);
      nodes.set(id, node);
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const source = ids[i],
          target = ids[j];
        const key = JSON.stringify([source, target]);
        const edge = edges.get(key) ?? { source, target, count: 0 };
        edge.count += 1;
        edges.set(key, edge);
      }
    }
  }
  const visible = [...nodes.values()]
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, 20);
  const ids = new Set(visible.map((node) => node.id));
  return {
    nodes: visible,
    links: [...edges.values()]
      .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
      .sort((a, b) => b.count - a.count)
      .slice(0, 80),
    articles: articles.map(({ id, title, category }) => ({
      id,
      title,
      category,
    })),
    articleCount: articles.length,
    tagCount: nodes.size,
    sampleLimit,
  };
}
