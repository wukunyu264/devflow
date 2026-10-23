import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteApp } from "@/components/site-app";
import { getPageData } from "@/lib/page-data";
import { categories } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Props = { params: Promise<{ path?: string[] }> };
const validId = (id?:string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
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
    if (path.length !== 2 || !validId(path[1])) notFound();
    const data = await getPageData(path[1]);
    const article = data.article;
    if (!article) notFound();
    return {
      title: article.title,
      description: article.excerpt,
      alternates:{canonical:absoluteUrl(`/article/${article.id}`)},
      openGraph:{type:"article",title:article.title,description:article.excerpt,url:absoluteUrl(`/article/${article.id}`),
        publishedTime:article.created_at,modifiedTime:article.updated_at,
        authors:[data.profiles.find(profile => profile.id === article.author_id)?.name || "DevFlow"],images:[absoluteUrl("/opengraph-image")]},
      robots:article.status === "draft" ? {index:false,follow:false} : undefined,
    };
  }
  if (path[0] === "category")
    return {
      title: categories.find((c) => c.slug === path[1])?.label || "技术分类",
    };
  if (path[0] === "user") return { title: "创作者主页" };
  return { title: names[path[0]] || "发现值得阅读的技术内容",alternates:{canonical:absoluteUrl("/" + path.join("/"))},
    robots:["write","login","register","dashboard","bookmarks","search"].includes(path[0]) ? {index:false,follow:false} : undefined };
}
export default async function Page({ params, searchParams }: Props & {searchParams: Promise<{edit?:string}>}) {
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
    (["article","user"].includes(path[0]) && !validId(path[1])) ||
    (path[0] === "category" && !categories.some((c) => c.slug === path[1]))
  )
    notFound();
  const query = await searchParams;
  const detailId = path[0] === "article" ? path[1] : path[0] === "write" ? query.edit : undefined;
  if (detailId && !validId(detailId)) notFound();
  const initial = await getPageData(detailId);
  if (path[0] === "article" && !initial.article) notFound();
  if (path[0] === "user" && !initial.profiles.some(profile => profile.id === path[1])) notFound();
  const article = path[0] === "article" ? initial.article : null;
  const jsonLd = article?.status === "published" ? {"@context":"https://schema.org","@type":"Article",headline:article.title,
    description:article.excerpt,datePublished:article.created_at,dateModified:article.updated_at,
    mainEntityOfPage:absoluteUrl(`/article/${article.id}`),image:absoluteUrl("/opengraph-image"),
    author:{"@type":"Person",name:initial.profiles.find(profile => profile.id === article.author_id)?.name || "DevFlow"}} : null;
  return (
    <Suspense
      fallback={
        <div className="page-loading">
          <div className="skeleton skeleton-large" />
        </div>
      }
    >
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replaceAll("<","\\u003c")}} />}
      <SiteApp initial={initial} />
    </Suspense>
  );
}
