import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteApp } from "@/components/site-app";
import { getCommunity } from "@/lib/community";
import { categories } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Props = { params: Promise<{ path?: string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path = [] } = await params;
  const names: Record<string, string> = {
    discover: "发现灵感",
    trending: "社区热榜",
    search: "搜索",
    bookmarks: "我的收藏",
    write: "写文章",
    login: "登录",
    register: "加入社区",
    dashboard: "创作中心",
    about: "关于社区",
    guidelines: "社区公约",
  };
  if (path[0] === "article") {
    const data = await getCommunity();
    const article = data.articles.find((a) => a.id === path[1]);
    return {
      title: article?.title || "阅读文章",
      description: article?.excerpt,
    };
  }
  if (path[0] === "category")
    return {
      title: categories.find((c) => c.slug === path[1])?.label || "技术分类",
    };
  if (path[0] === "user") return { title: "创作者主页" };
  return { title: names[path[0]] || "发现值得阅读的技术内容" };
}
export default async function Page({ params }: Props) {
  const { path = [] } = await params;
  const simple = [
    "discover",
    "trending",
    "search",
    "bookmarks",
    "write",
    "login",
    "register",
    "dashboard",
    "about",
    "guidelines",
  ];
  const valid =
    path.length === 0 ||
    (path.length === 1 && simple.includes(path[0])) ||
    (path.length === 2 && ["article", "user", "category"].includes(path[0]));
  if (
    !valid ||
    (path[0] === "category" && !categories.some((c) => c.slug === path[1]))
  )
    notFound();
  const initial = await getCommunity();
  return (
    <Suspense
      fallback={
        <div className="page-loading">
          <div className="skeleton skeleton-large" />
        </div>
      }
    >
      <SiteApp initial={initial} />
    </Suspense>
  );
}
