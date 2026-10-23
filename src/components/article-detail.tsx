"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Link2,
  List,
  MessageCircle,
  PenLine,
  Plus,
  Send,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { request, useCommunity } from "./community-provider";
import {
  Avatar,
  Cover,
  Empty,
  formatCount,
  formatDate,
  readTime,
  Spinner,
} from "./ui";
import { MarkdownContent } from "./markdown-lazy";
import { ArticleCard } from "./feed";
import { categories } from "@/lib/types";

export function ArticleDetail({ id }: { id: string }) {
  const { data, act, loading } = useCommunity();
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [headings, setHeadings] = useState<
    { title: string; id: string; level: number }[]
  >([]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const article = data.article?.id === id ? data.article : null;
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!data.user) return;
    const key = `df-view-${data.user.id}-${id}-${new Date().toISOString().slice(0,10)}`;
    if (!sessionStorage.getItem(key))
      request("view", { id })
        .then(() => {
          sessionStorage.setItem(key, "1");
        })
        .catch(() => {});
  }, [id, data.user]);
  useEffect(() => {
    const updateHeadings = () => setHeadings(
      Array.from(
        document.querySelectorAll(".article-body h2, .article-body h3"),
      ).map((node) => ({
        title: node.textContent || "",
        id: node.id,
        level: Number(node.tagName[1]),
      })),
    );
    const onScroll = () => {
      const distance =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(
        distance > 0 ? Math.min(100, (window.scrollY / distance) * 100) : 100,
      );
      const headings = Array.from(
        document.querySelectorAll(".article-body h2, .article-body h3"),
      );
      const current = headings
        .filter((h) => h.getBoundingClientRect().top < 170)
        .at(-1);
      if (current) setActiveHeading(current.id);
    };
    const container = document.querySelector(".article-body");
    const observer = new MutationObserver(updateHeadings);
    if (container) observer.observe(container, {childList:true,subtree:true});
    const initialFrame = requestAnimationFrame(() => { updateHeadings(); onScroll(); });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(initialFrame); observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [article?.content, id]);
  if (!article)
    return (
      <main className="standalone-page">
        <Empty
          title={loading ? "正在寻找这篇文章…" : "这篇文章暂时不在这里"}
          text={
            loading
              ? "稍等片刻，灵感马上抵达。"
              : "文章可能已被删除、设为草稿，或链接有误。"
          }
          action={
            <Link className="button primary" href="/">
              返回首页
            </Link>
          }
        />
      </main>
    );
  const author = data.profiles.find((p) => p.id === article.author_id);
  const liked = data.likes.some(
    (l) => l.article_id === id && l.user_id === data.user?.id,
  );
  const saved = data.bookmarks.some((b) => b.article_id === id);
  const following = data.follows.some(
    (f) => f.author_id === article.author_id && f.user_id === data.user?.id,
  );
  const comments = data.comments
    .filter((c) => c.article_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const likes =
    article.seed_likes + data.likes.filter((l) => l.article_id === id).length;
  const related = data.articles
    .filter(
      (a) =>
        a.category === article.category &&
        a.id !== id &&
        a.status === "published",
    )
    .slice(0, 3);
  const toggle = async (action: string) => {
    if (busy) return;
    setBusy(action);
    await act(action, { id: action === "follow" ? article.author_id : id });
    setBusy("");
  };
  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <main className="reading-layout">
        <div className="reading-actions">
          <Link className="icon-circle" href="/" title="返回首页">
            <ArrowLeft size={19} />
          </Link>
          <button
            disabled={!!busy}
            onClick={() => toggle("like")}
            className={`icon-circle ${liked ? "is-active" : ""}`}
            aria-label={liked ? "取消点赞" : "点赞"}
          >
            <ThumbsUp size={20} />
            <span>{likes}</span>
          </button>
          <button
            disabled={!!busy}
            onClick={() => toggle("bookmark")}
            className={`icon-circle ${saved ? "is-active" : ""}`}
            aria-label={saved ? "取消收藏" : "收藏"}
          >
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </button>
          <a className="icon-circle" href="#comments" title="评论">
            <MessageCircle size={20} />
            <span>{comments.length}</span>
          </a>
          <button
            className="icon-circle"
            aria-label="复制文章链接"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  window.location.href.split("#")[0],
                );
                toast.success("文章链接已复制");
              } catch {
                toast.error("请复制地址栏中的链接");
              }
            }}
          >
            <Link2 size={20} />
          </button>
        </div>
        <div className="reading-main">
          <article className="reading-card">
            <div className="breadcrumb">
              <Link href="/">首页</Link>
              <ChevronRight size={13} />
              <Link href={`/category/${article.category}`}>
                {categories.find((c) => c.slug === article.category)?.label}
              </Link>
              <ChevronRight size={13} />
              <span>文章</span>
            </div>
            <div className="article-detail-tags">
              {article.tags.map((t) => (
                <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`}>
                  # {t}
                </Link>
              ))}
              {article.status === "draft" && (
                <span className="badge">草稿 · 仅自己可见</span>
              )}
            </div>
            <h1 className="article-detail-title">{article.title}</h1>
            <div className="article-author-line">
              <Link href={`/user/${article.author_id}`}>
                <Avatar user={author} size={40} />
                <div>
                  <strong>{author?.name}</strong>
                  <span>
                    {formatDate(article.created_at)}
                    <i>·</i>
                    <Clock3 size={12} />
                    {readTime(article)} 分钟阅读<i>·</i>
                    <Eye size={12} />
                    {formatCount(article.views)}
                  </span>
                </div>
              </Link>
              {data.user?.id === article.author_id ? (
                <Link
                  className="button secondary small"
                  href={`/write?edit=${article.id}`}
                >
                  <PenLine size={14} />
                  编辑
                </Link>
              ) : (
                <button
                  disabled={!!busy}
                  className={`button ${following ? "secondary" : "soft"} small`}
                  onClick={() => toggle("follow")}
                >
                  {following ? <Check size={14} /> : <Plus size={14} />}
                  {following ? "已关注" : "关注"}
                </button>
              )}
            </div>
            {article.cover !== "none" && <Cover kind={article.cover} large />}
            <div className="article-body">
              <MarkdownContent content={article.content} />
            </div>
            <div className="article-end-mark">
              <span />
              <span>感谢阅读，愿这份分享对你有用。</span>
              <span />
            </div>
            <div className="article-bottom-actions">
              <button
                className={`button ${liked ? "primary" : "soft"}`}
                disabled={!!busy}
                onClick={() => toggle("like")}
              >
                <ThumbsUp size={17} />
                {liked ? "已点赞" : "觉得有帮助，点个赞"}
                <span>{likes}</span>
              </button>
              <button
                className={`button secondary ${saved ? "is-active" : ""}`}
                disabled={!!busy}
                onClick={() => toggle("bookmark")}
              >
                <Bookmark size={17} />
                {saved ? "已收藏" : "收藏，稍后再读"}
              </button>
            </div>
            <p className="article-copyright">
              本文为作者原创分享，转载请联系作者并注明出处。示例内容仅供学习交流。
            </p>
          </article>
          <section className="comments-card" id="comments">
            <h2>
              一起聊聊<span>{comments.length}</span>
            </h2>
            <p>一个新的视角，可能就是下一次灵感的开始。</p>
            <form
              className="comment-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                setSending(true);
                if (
                  await act("comment", { id, content: comment }, "评论已发布")
                )
                  setComment("");
                setSending(false);
              }}
            >
              <Avatar user={data.user} size={36} />
              <div>
                <textarea
                  placeholder={
                    data.user
                      ? "分享你的想法，让讨论继续…"
                      : "登录后，分享你的想法…"
                  }
                  aria-label="评论内容"
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div>
                  <span>{comment.length} / 1000</span>
                  {data.user ? (
                    <button
                      className="button primary small"
                      disabled={sending || !comment.trim()}
                    >
                      {sending ? <Spinner /> : <Send size={14} />}发布评论
                    </button>
                  ) : (
                    <Link
                      className="button primary small"
                      href={`/login?next=${encodeURIComponent(`/article/${id}#comments`)}`}
                    >
                      登录参与讨论
                    </Link>
                  )}
                </div>
              </div>
            </form>
            {comments.length ? (
              comments.map((c) => {
                const person = data.profiles.find((p) => p.id === c.user_id);
                return (
                  <div className="comment" key={c.id}>
                    <Avatar user={person} size={34} />
                    <div>
                      <div className="comment-meta">
                        <Link href={`/user/${c.user_id}`}>{person?.name}</Link>
                        <span>{formatDate(c.created_at)}</span>
                        {c.user_id === data.user?.id && (
                          <button
                            disabled={deleting === c.id}
                            aria-label="删除自己的评论"
                            onClick={async () => {
                              setDeleting(c.id);
                              await act(
                                "deleteComment",
                                { id: c.id },
                                "评论已删除",
                              );
                              setDeleting(null);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="comments-empty">
                <MessageCircle size={24} />
                <p>还没有评论，来做第一个分享观点的人。</p>
              </div>
            )}
          </section>
          {related.length > 0 && (
            <section className="related-section">
              <h2>
                继续探索 <ArrowUpRight size={18} />
              </h2>
              <div className="article-list-panel">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="reading-sidebar">
          <section className="reader-author">
            <Link href={`/user/${article.author_id}`}>
              <Avatar user={author} size={52} />
              <h3>{author?.name}</h3>
              <span>{author?.role}</span>
            </Link>
            <p>{author?.bio}</p>
            <div className="author-stats">
              <span>
                <strong>
                  {
                    data.articles.filter(
                      (a) =>
                        a.author_id === article.author_id &&
                        a.status === "published",
                    ).length
                  }
                </strong>
                文章
              </span>
              <span>
                <strong>
                  {
                    data.follows.filter(
                      (f) => f.author_id === article.author_id,
                    ).length
                  }
                </strong>
                关注者
              </span>
            </div>
            <Link
              className="button secondary"
              href={`/user/${article.author_id}`}
            >
              访问个人主页 <ArrowUpRight size={14} />
            </Link>
          </section>
          <nav className="toc" aria-label="文章目录">
            <h3>
              <List size={16} />
              本文目录
            </h3>
            {headings.map((h) => (
              <a
                key={h.id}
                className={`${activeHeading === h.id ? "active" : ""} level-${h.level}`}
                href={`#${h.id}`}
                onClick={() => setActiveHeading(h.id)}
              >
                {h.title}
              </a>
            ))}
            <span className="toc-progress">
              已阅读 {Math.round(progress)}%
              <span>
                <i style={{ width: `${progress}%` }} />
              </span>
            </span>
          </nav>
        </aside>
      </main>
    </>
  );
}
