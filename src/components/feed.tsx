"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Eye,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Plus,
  PenLine,
  ChevronRight,
  Flame,
  Code2,
  Zap,
  Users,
  Compass,
  Filter,
  Hash,
} from "lucide-react";
import { useCommunity } from "./community-provider";
import {
  Avatar,
  Cover,
  Empty,
  formatCount,
  formatDate,
  TextLink,
  Spinner,
} from "./ui";
import type { Article } from "@/lib/types";
import { categories } from "@/lib/types";
import { Sidebar } from "./navigation";

export function ArticleCard({ article }: { article: Article }) {
  const { data, act } = useCommunity();
  const [busy, setBusy] = useState(false);
  const author = data.profiles.find((p) => p.id === article.author_id);
  const liked = data.likes.some(
    (l) => l.article_id === article.id && l.user_id === data.user?.id,
  );
  const saved = data.bookmarks.some((b) => b.article_id === article.id);
  const likes =
    article.seed_likes +
    data.likes.filter((l) => l.article_id === article.id).length;
  const toggle = async (action: string) => {
    if (busy) return;
    setBusy(true);
    await act(action, { id: article.id });
    setBusy(false);
  };
  return (
    <article className="article-card">
      <div className="article-card-meta">
        <Link href={`/user/${article.author_id}`} className="author-mini">
          <Avatar user={author} size={24} />
          <span>{author?.name || "社区作者"}</span>
        </Link>
        <span className="meta-dot">·</span>
        <time dateTime={article.created_at}>
          {formatDate(article.created_at)}
        </time>
        {article.status === "draft" && <span className="badge">草稿</span>}
      </div>
      <div className="article-card-body">
        <div className="article-copy">
          <Link href={`/article/${article.id}`} className="article-title-link">
            <h2>{article.title}</h2>
          </Link>
          <p>{article.excerpt}</p>
        </div>
        <Link
          href={`/article/${article.id}`}
          className="article-thumbnail"
          aria-label={`阅读：${article.title}`}
        >
          <Cover kind={article.cover} />
        </Link>
      </div>
      <div className="article-card-bottom">
        <div className="article-metrics">
          <span title="阅读量">
            <Eye size={14} />
            {formatCount(article.views)}
          </span>
          <button
            className={liked ? "is-active" : ""}
            disabled={busy}
            aria-label={liked ? "取消点赞" : "点赞文章"}
            onClick={() => toggle("like")}
          >
            <ThumbsUp size={14} />
            {formatCount(likes)}
          </button>
          <Link href={`/article/${article.id}#comments`} aria-label="查看评论">
            <MessageCircle size={14} />
            {data.comments.filter((c) => c.article_id === article.id).length ||
              "评论"}
          </Link>
          <button
            className={`card-save ${saved ? "is-active" : ""}`}
            disabled={busy}
            aria-label={saved ? "取消收藏" : "收藏文章"}
            onClick={() => toggle("bookmark")}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="article-tags">
          {article.tags.slice(0, 2).map((t) => (
            <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`}>
              {t}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
export function RightSidebar() {
  const { data, act } = useCommunity();
  const [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const published = data.articles.filter((a) => a.status === "published");
  const popular = [...published]
    .sort((a, b) => b.seed_likes + b.views / 30 - a.seed_likes - a.views / 30)
    .slice(0, 5);
  const people = data.profiles.filter(
    (p) =>
      p.id !== data.user?.id && published.some((a) => a.author_id === p.id),
  );
  const authors = people.slice(
    rotation % Math.max(people.length - 2, 1),
    (rotation % Math.max(people.length - 2, 1)) + 3,
  );
  const tags = Array.from(new Set(published.flatMap((a) => a.tags))).slice(
    0,
    10,
  );
  return (
    <aside className="right-sidebar">
      <div className="creator-card">
        <div className="creator-top">
          <span className="creator-icon">
            <PenLine size={21} />
          </span>
          <span>每一个想法，都值得被看见</span>
        </div>
        <h3>
          {data.user ? `${data.user.name}，欢迎回来` : "在这里，开启你的创作"}
        </h3>
        <p>记录技术成长，连接志同道合的人。</p>
        <Link
          href={data.user ? "/dashboard" : "/write"}
          className="button primary"
        >
          {data.user ? "进入创作中心" : "开始我的第一篇创作"}
          <ArrowRight size={15} />
        </Link>
      </div>
      <section className="side-section rankings">
        <div className="section-title">
          <h3>
            <Flame size={17} className="flame" />
            社区热榜
          </h3>
          <Link href="/trending">
            更多
            <ChevronRight size={13} />
          </Link>
        </div>
        <p className="section-subtitle">好内容，值得被更多人看见</p>
        <ol>
          {popular.map((a, i) => (
            <li key={a.id}>
              <span className={`rank rank-${i}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link href={`/article/${a.id}`}>
                <strong>{a.title}</strong>
                <small>
                  {formatCount(a.views)} 阅读<span>·</span>
                  {a.tags[0]}
                </small>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <section className="side-section">
        <div className="section-title">
          <h3>
            <Hash size={17} />
            热门话题
          </h3>
          <Link href="/discover">
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="hot-tags">
          {tags.map((t, i) => (
            <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`}>
              <span>#</span>
              {t}
              {i < 2 && <TrendingUp size={11} />}
            </Link>
          ))}
        </div>
      </section>
      <section className="side-section recommended-authors">
        <div className="section-title">
          <h3>值得关注的人</h3>
          <button onClick={() => setRotation((r) => r + 1)}>
            <RefreshCw size={12} />
            换一批
          </button>
        </div>
        {authors.map((p) => {
          const following = data.follows.some(
            (f) => f.author_id === p.id && f.user_id === data.user?.id,
          );
          return (
            <div className="recommended-author" key={p.id}>
              <Link href={`/user/${p.id}`}>
                <Avatar user={p} size={36} />
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.role}</small>
                </div>
              </Link>
              <button
                disabled={busy === p.id}
                className={`follow-mini ${following ? "followed" : ""}`}
                aria-label={following ? `取消关注${p.name}` : `关注${p.name}`}
                onClick={async () => {
                  setBusy(p.id);
                  await act("follow", { id: p.id });
                  setBusy(null);
                }}
              >
                {following ? (
                  "已关注"
                ) : (
                  <>
                    <Plus size={12} />
                    关注
                  </>
                )}
              </button>
            </div>
          );
        })}
      </section>
      <Link href="/guidelines" className="community-note">
        <span className="note-dot" />
        <div>
          <strong>好的社区，由我们一起创造</strong>
          <p>真诚分享，保持好奇，尊重每一种声音。</p>
          <span>
            了解社区公约 <ArrowUpRight size={12} />
          </span>
        </div>
      </Link>
      <div className="side-footnote">
        为热爱技术的人而建 <span>✳</span>
      </div>
    </aside>
  );
}
function Hero({ ai = false }: { ai?: boolean }) {
  return (
    <section className={`hero ${ai ? "hero-ai" : ""}`}>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span />
          <span>
            {ai ? "THE NEXT CHAPTER OF BUILDING" : "A SPACE FOR CURIOUS MINDS"}
          </span>
        </div>
        <h1>
          {ai ? (
            <>
              与 AI 一起，
              <br />
              探索下一个可能<span>。</span>
            </>
          ) : (
            <>
              让技术沉淀，
              <br />
              让灵感<span className="hero-emphasis">自由流动</span>。
            </>
          )}
        </h1>
        <p>
          {ai
            ? "从模型到应用，从第一个 Prompt 到真正的产品。"
            : "发现值得阅读的内容，遇见一起成长的开发者。"}
        </p>
        <Link className="hero-cta" href={ai ? "/write" : "/category/ai"}>
          {ai ? "分享你的 AI 实践" : "探索 AI 的更多可能"}
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="orbital orbital-1" />
        <div className="orbital orbital-2" />
        <div className="orbital orbital-3" />
        <div className="hero-code">
          <span className="code-corner top-left" />
          <span className="code-corner bottom-right" />
          <Code2 size={58} strokeWidth={1.4} />
        </div>
        <span className="orbit-node node-one">
          <Sparkles size={18} />
        </span>
        <span className="orbit-node node-two">
          <BracesIcon />
        </span>
        <span className="orbit-node node-three">
          <Zap size={15} />
        </span>
        <span className="hero-art-label">IDEAS INTO IMPACT.</span>
        <span className="star star-one">✳</span>
        <span className="star star-two">+</span>
      </div>
      <div className="hero-bottom-label">
        DEVFLOW JOURNAL <span>VOL. 024</span>
      </div>
    </section>
  );
}
function BracesIcon() {
  return <span className="braces-icon">{"{ }"}</span>;
}
export function Feed({
  kind = "home",
  category,
}: {
  kind?: "home" | "trending" | "discover" | "search" | "category" | "bookmarks";
  category?: string;
}) {
  const { data, loading } = useCommunity();
  const params = useSearchParams();
  const [sort, setSort] = useState(kind === "trending" ? "hot" : "recommend");
  const [visible, setVisible] = useState(7);
  const q = params.get("q") || "";
  const tag = params.get("tag") || "";
  const following = params.get("feed") === "following";
  useEffect(() => {
    setVisible(7);
    setSort(kind === "trending" ? "hot" : "recommend");
  }, [kind, category, q, tag, following]);
  const list = useMemo(() => {
    let result = data.articles.filter((a) => a.status === "published");
    if (category) result = result.filter((a) => a.category === category);
    if (kind === "bookmarks")
      result = result.filter((a) =>
        data.bookmarks.some((b) => b.article_id === a.id),
      );
    if (following)
      result = result.filter((a) =>
        data.follows.some(
          (f) => f.author_id === a.author_id && f.user_id === data.user?.id,
        ),
      );
    if (tag) result = result.filter((a) => a.tags.includes(tag));
    if (q) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((a) =>
        words.every((word) =>
          `${a.title} ${a.excerpt} ${a.content} ${a.tags.join(" ")} ${data.profiles.find((p) => p.id === a.author_id)?.name || ""}`
            .toLowerCase()
            .includes(word),
        ),
      );
    }
    if (sort === "hot")
      result = [...result].sort(
        (a, b) =>
          b.seed_likes +
          b.views / 30 +
          data.likes.filter((l) => l.article_id === b.id).length -
          a.seed_likes -
          a.views / 30 -
          data.likes.filter((l) => l.article_id === a.id).length,
      );
    else if (sort === "latest")
      result = [...result].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
    return result;
  }, [data, category, kind, following, tag, q, sort]);
  const currentCategory = categories.find((c) => c.slug === category);
  const title = following
    ? "我的关注"
    : kind === "bookmarks"
      ? "我的收藏"
      : kind === "trending"
        ? "此刻，大家都在读"
        : kind === "discover"
          ? "发现你的下一份灵感"
          : kind === "search"
            ? tag
              ? `# ${tag}`
              : q
                ? `「${q}」的搜索结果`
                : "发现感兴趣的技术"
            : currentCategory?.label || "为你推荐";
  const showHero = (kind === "home" && !following) || category === "ai";
  return (
    <main className="community-layout">
      <Sidebar />
      <div className="feed-column">
        {showHero && <Hero ai={category === "ai"} />}
        {kind === "discover" && (
          <div className="discover-intro">
            <span className="eyebrow">FIND YOUR NEXT INSPIRATION</span>
            <h1>
              {title}
              <span>↗</span>
            </h1>
            <p>每一份好奇，都有值得深入的方向。</p>
            <div className="topic-grid">
              {categories.slice(0, 6).map((c, i) => (
                <Link key={c.slug} href={`/category/${c.slug}`}>
                  <span>0{i + 1}</span>
                  <strong>{c.label}</strong>
                  <small>
                    {
                      data.articles.filter(
                        (a) =>
                          a.category === c.slug && a.status === "published",
                      ).length
                    }{" "}
                    篇文章
                    <ArrowUpRight size={14} />
                  </small>
                </Link>
              ))}
            </div>
          </div>
        )}
        {!showHero && kind !== "discover" && (
          <div className="page-intro">
            <span className="eyebrow">
              {kind === "bookmarks"
                ? "YOUR PERSONAL READING LIST"
                : kind === "trending"
                  ? "WORTH YOUR ATTENTION"
                  : kind === "search"
                    ? "FOLLOW YOUR CURIOSITY"
                    : "EXPLORE & KEEP GROWING"}
            </span>
            <h1>
              {title}
              {kind === "trending" && <Flame size={27} />}
            </h1>
            <p>
              {kind === "bookmarks"
                ? "把好内容留在这里，随时回来继续阅读。"
                : kind === "search"
                  ? `找到 ${list.length} 篇相关内容`
                  : following
                    ? "来自你关注的创作者，新的思考和新的发现。"
                    : "在分享与交流中，找到让自己成长的答案。"}
            </p>
          </div>
        )}
        <section className="article-list-panel">
          <div className="feed-tabs">
            <div className="tab-group">
              {(kind === "search" || kind === "bookmarks"
                ? [
                    [
                      "recommend",
                      kind === "bookmarks" ? "全部收藏" : "全部结果",
                    ],
                    ["latest", "最新发布"],
                  ]
                : [
                    ["recommend", "推荐"],
                    ["latest", "最新"],
                    ["hot", "热门"],
                  ]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setSort(value);
                    setVisible(7);
                  }}
                  className={sort === value ? "tab active" : "tab"}
                >
                  {value === "recommend" &&
                    kind !== "search" &&
                    kind !== "bookmarks" && <Sparkles size={15} />}
                  {label}
                </button>
              ))}
            </div>
            <span className="feed-caption">
              {kind === "home" && !following
                ? "每一次阅读，都是一次成长"
                : `${list.length} 篇文章`}
            </span>
          </div>
          {kind === "bookmarks" && !data.user ? (
            <Empty
              title="你的私人灵感书架"
              text="登录后，收藏喜欢的文章，随时回来阅读。"
              action={
                <Link
                  href="/login?next=%2Fbookmarks"
                  className="button primary"
                >
                  登录，开启收藏
                </Link>
              }
            />
          ) : !list.length ? (
            <Empty
              title={
                following
                  ? "关注有趣的人，让灵感先来找你"
                  : "还没有找到相关内容"
              }
              text={
                following
                  ? "在右侧发现创作者，关注后就能在这里看到他们的文章。"
                  : "换个关键词，或探索一个新的技术方向。"
              }
              action={
                <Link className="button secondary" href="/discover">
                  去发现内容 <Compass size={15} />
                </Link>
              }
            />
          ) : (
            <>
              {list.slice(0, visible).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              <div className="load-more">
                {visible < list.length ? (
                  <button onClick={() => setVisible((v) => v + 7)}>
                    发现更多好内容 <ArrowRight size={15} />
                  </button>
                ) : (
                  <span>
                    <span />
                    你已经读完了这里的全部内容
                    <span />
                  </span>
                )}
              </div>
            </>
          )}
        </section>
        <div className="feed-end">
          <span className="little-spark">✳</span>保持好奇，持续生长。
        </div>
      </div>
      <RightSidebar />
    </main>
  );
}
