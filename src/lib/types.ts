export type Category =
  | "frontend"
  | "backend"
  | "ai"
  | "java"
  | "python"
  | "database"
  | "tools"
  | "architecture";
export type Profile = {
  id: string;
  name: string;
  bio: string;
  color: string;
  role: string;
  created_at: string;
};
export type Article = {
  id: string;
  author_id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  tags: string[];
  cover: string;
  status: "published" | "draft";
  views: number;
  seed_likes: number;
  created_at: string;
  updated_at: string;
};
export type Comment = {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
};
export type ArticleSummary = Omit<Article, "content"> & { reading_minutes: number };
export type Reaction = {
  id: string;
  article_id: string;
  user_id: string;
  created_at: string;
};
export type Follow = {
  id: string;
  author_id: string;
  user_id: string;
  created_at: string;
};
export type Community = {
  articles: ArticleSummary[];
  article: Article | null;
  profiles: Profile[];
  comments: Comment[];
  likes: Reaction[];
  bookmarks: Reaction[];
  follows: Follow[];
  user: Profile | null;
  mode: "local" | "supabase";
};
export const categories: { slug: Category; label: string; short: string }[] = [
  { slug: "frontend", label: "前端开发", short: "前端" },
  { slug: "backend", label: "后端开发", short: "后端" },
  { slug: "ai", label: "人工智能", short: "AI" },
  { slug: "java", label: "Java", short: "Java" },
  { slug: "python", label: "Python", short: "Python" },
  { slug: "database", label: "数据库", short: "数据库" },
  { slug: "tools", label: "开发工具", short: "工具" },
  { slug: "architecture", label: "架构设计", short: "架构" },
];
