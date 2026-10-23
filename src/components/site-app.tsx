"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  Heart,
  Leaf,
  MessageCircle,
} from "lucide-react";
import type { Community } from "@/lib/types";
import { CommunityProvider } from "./community-provider";
import { Header, Footer } from "./navigation";
import { Feed } from "./feed";
const ArticleDetail = dynamic(() =>
  import("./article-detail").then((module) => module.ArticleDetail),
);
const Editor = dynamic(
  () => import("./editor").then((module) => module.Editor),
  { ssr: false },
);
const Account = dynamic(() =>
  import("./account").then((module) => module.Account),
);
const Dashboard = dynamic(() =>
  import("./dashboard").then((module) => module.Dashboard),
);
const ProfilePage = dynamic(() =>
  import("./dashboard").then((module) => module.ProfilePage),
);

export function SiteApp({ initial }: { initial: Community }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const segments = pathname.split("/").filter(Boolean);
  const page = segments[0] || "home";
  const auth = page === "login" || page === "register";
  let content;
  switch (page) {
    case "home":
    case "community":
      content = <Feed />;
      break;
    case "discover":
      content = <Feed kind="discover" />;
      break;
    case "trending":
      content = <Feed kind="trending" />;
      break;
    case "search":
      content = <Feed kind="search" />;
      break;
    case "category":
      content = <Feed kind="category" category={segments[1]} />;
      break;
    case "bookmarks":
      content = <Feed kind="bookmarks" />;
      break;
    case "article":
      content = <ArticleDetail id={segments[1]} />;
      break;
    case "write":
      content = <Editor />;
      break;
    case "login":
      content = <Account key="login" />;
      break;
    case "register":
      content = <Account key="register" register />;
      break;
    case "dashboard":
      content = <Dashboard />;
      break;
    case "user":
      content = <ProfilePage id={segments[1]} />;
      break;
    default:
      content = <InfoPage guidelines={page === "guidelines"} />;
  }
  return (
    <CommunityProvider
      key={pathname + "?" + query + (initial.user?.id || "")}
      initial={initial}
    >
      {!auth && <Header />}
      {content}
      {!auth && page !== "write" && <Footer />}
    </CommunityProvider>
  );
}
function InfoPage({ guidelines }: { guidelines: boolean }) {
  return (
    <main className="info-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={15} />
        返回社区
      </Link>
      <span className="eyebrow">
        {guidelines ? "A BETTER PLACE, TOGETHER" : "A SPACE FOR CURIOUS MINDS"}
      </span>
      <h1>
        {guidelines ? (
          <>
            好的社区，
            <br />
            由我们一起创造。
          </>
        ) : (
          <>
            让技术沉淀，
            <br />
            让灵感自由流动。
          </>
        )}
      </h1>
      <p className="info-lead">
        {guidelines
          ? "真诚、好奇、尊重。我们希望这里的每一次交流，都能带来一点新的收获。"
          : "DevFlow 是一个面向开发者与技术爱好者的内容社区。我们相信，技术的价值不仅在于实现，更在于人与人之间的交流与连接。"}
      </p>
      <div className="info-principles">
        {(guidelines
          ? [
              {
                icon: Code2,
                title: "分享真实经验",
                text: "鼓励原创、可复现的实践与思考。引用他人内容时请注明来源，不发布抄袭、误导性宣传或未经允许的私人信息。",
              },
              {
                icon: MessageCircle,
                title: "友善讨论，尊重差异",
                text: "对事不对人。不同技术选择都有自己的场景，欢迎有证据的讨论，拒绝人身攻击、骚扰和歧视。",
              },
              {
                icon: Leaf,
                title: "一起守护内容质量",
                text: "清晰的标题、准确的标签和有帮助的代码示例，会让分享更容易被理解。请勿发布垃圾广告或无关内容。",
              },
            ]
          : [
              {
                icon: Code2,
                title: "为构建者而生",
                text: "从前端到后端，从 AI 到系统设计。在这里找到值得深入阅读的技术内容，把知识带回真实的项目。",
              },
              {
                icon: Heart,
                title: "让经验被看见",
                text: "一次踩坑、一段思考、一个小工具，都值得分享。无需等待完美，你的经验可能正是另一位开发者需要的答案。",
              },
              {
                icon: Leaf,
                title: "保持好奇，持续生长",
                text: "关注感兴趣的创作者，收藏值得反复阅读的文章，在评论中交换观点，与热爱技术的人一起成长。",
              },
            ]
        ).map((p) => (
          <section key={p.title}>
            <p.icon size={25} strokeWidth={1.4} />
            <h2>{p.title}</h2>
            <p>{p.text}</p>
          </section>
        ))}
      </div>
      <Link
        className="button primary"
        href={guidelines ? "/write" : "/discover"}
      >
        {guidelines ? "开始一份真诚的分享" : "发现你的下一份灵感"}
        <ArrowUpRight size={16} />
      </Link>
    </main>
  );
}
