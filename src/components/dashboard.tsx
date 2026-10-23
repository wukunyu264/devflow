"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Eye,
  FileText,
  PenLine,
  Plus,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import { useCommunity } from "./community-provider";
import { Avatar, Empty, formatCount, formatDate, Modal, Spinner } from "./ui";
import { Sidebar } from "./navigation";
import { ArticleCard } from "./feed";
import type { ArticleSummary } from "@/lib/types";

export function Dashboard() {
  const { data, loading, act } = useCommunity();
  const [tab, setTab] = useState("published");
  const [deleting, setDeleting] = useState<ArticleSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const own = data.articles.filter((a) => a.author_id === data.user?.id);
  const published = own.filter((a) => a.status === "published");
  const drafts = own.filter((a) => a.status === "draft");
  const articles = tab === "draft" ? drafts : published;
  if (loading)
    return (
      <main id="main-content" tabIndex={-1} className="standalone-page">
        <div className="skeleton skeleton-large" />
      </main>
    );
  if (!data.user)
    return (
      <main id="main-content" tabIndex={-1} className="standalone-page">
        <Empty
          title="你的创作，从这里出发"
          text="登录后管理文章、保存草稿，看到每一份分享的回响。"
          action={
            <Link className="button primary" href="/login?next=%2Fdashboard">
              登录创作中心 <ArrowRight size={16} />
            </Link>
          }
        />
      </main>
    );
  return (
    <main id="main-content" tabIndex={-1} className="community-layout wide-layout">
      <Sidebar />
      <div className="dashboard-column">
        <div className="dashboard-intro">
          <div>
            <span className="eyebrow">YOUR CREATIVE SPACE</span>
            <h1>把想法，变成作品。</h1>
            <p>{data.user.name}，今天有什么值得分享的新发现？</p>
          </div>
          <Link className="button primary" href="/write">
            <Plus size={17} />
            写一篇新文章
          </Link>
        </div>
        <div className="dashboard-stats">
          {[
            { label: "已发布文章", value: published.length, icon: FileText },
            {
              label: "文章总阅读",
              value: published.reduce((n, a) => n + a.views, 0),
              icon: Eye,
            },
            {
              label: "收获的赞",
              value: published.reduce(
                (n, a) =>
                  n +
                  a.seed_likes +
                  data.likes.filter((l) => l.article_id === a.id).length,
                0,
              ),
              icon: ThumbsUp,
            },
            {
              label: "关注者",
              value: data.follows.filter((f) => f.author_id === data.user?.id)
                .length,
              icon: Users,
            },
          ].map((s) => (
            <div key={s.label}>
              <span>
                <s.icon size={18} />
                {s.label}
              </span>
              <strong>{formatCount(s.value)}</strong>
              <small>每一份积累，都算数</small>
            </div>
          ))}
        </div>
        <section className="dashboard-content">
          <div className="dashboard-content-heading">
            <h2>内容管理</h2>
            <Link href={`/user/${data.user.id}`}>
              查看个人主页 <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="feed-tabs">
            <div className="tab-group">
              <button
                className={`tab ${tab === "published" ? "active" : ""}`}
                onClick={() => setTab("published")}
              >
                已发布<span>{published.length}</span>
              </button>
              <button
                className={`tab ${tab === "draft" ? "active" : ""}`}
                onClick={() => setTab("draft")}
              >
                草稿箱<span>{drafts.length}</span>
              </button>
            </div>
            <span className="feed-caption">所有内容已保存在数据库</span>
          </div>
          {articles.length ? (
            <div className="management-list">
              {articles.map((a) => (
                <div className="management-row" key={a.id}>
                  <div>
                    <Link
                      href={
                        a.status === "draft"
                          ? `/write?edit=${a.id}`
                          : `/article/${a.id}`
                      }
                    >
                      <h3>{a.title}</h3>
                    </Link>
                    <span>
                      {formatDate(a.updated_at)} 更新<i>·</i>
                      {a.status === "draft" ? "仅自己可见" : `${a.views} 阅读`}
                      <i>·</i>
                      {a.tags.join(" / ") || "暂无标签"}
                    </span>
                  </div>
                  <div>
                    <Link
                      className="icon-button"
                      href={`/write?edit=${a.id}`}
                      aria-label={`编辑${a.title}`}
                    >
                      <PenLine size={17} />
                    </Link>
                    <button
                      className="icon-button danger"
                      aria-label={`删除${a.title}`}
                      onClick={() => setDeleting(a)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={
                tab === "draft"
                  ? "给未完成的灵感留个位置"
                  : "第一篇分享，就从现在开始"
              }
              text={
                tab === "draft"
                  ? "编辑器里的「保存草稿」，帮你留住还在生长的想法。"
                  : "经验、踩坑记录、一个有趣的发现，都值得写下来。"
              }
              action={
                <Link className="button primary" href="/write">
                  <PenLine size={15} />
                  开始创作
                </Link>
              }
            />
          )}
        </section>
        <Link className="dashboard-tip" href="/guidelines">
          <span>✳</span>
          <div>
            <strong>好文章，始于一次真诚的分享。</strong>
            <p>清晰的标题、可运行的示例、真实的思考，胜过完美的辞藻。</p>
          </div>
          <ArrowUpRight size={21} />
        </Link>
      </div>
      {deleting && (
        <Modal
          title="确定删除这篇文章？"
          onClose={() => !busy && setDeleting(null)}
        >
          <p className="modal-description">
            「{deleting.title}」及其评论、点赞和收藏将被删除。此操作无法撤销。
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              保留文章
            </button>
            <button
              className="button danger-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                if (
                  await act("deleteArticle", { id: deleting.id }, "文章已删除")
                )
                  setDeleting(null);
                setBusy(false);
              }}
            >
              {busy ? <Spinner /> : <Trash2 size={15} />}确定删除
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
export function ProfilePage({ id }: { id: string }) {
  const { data, loading, act } = useCommunity();
  const [tab, setTab] = useState("articles");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const person = data.profiles.find((p) => p.id === id);
  const own = id === data.user?.id;
  const articles = data.articles.filter(
    (a) => a.author_id === id && a.status === "published",
  );
  const saved = data.articles.filter(
    (a) =>
      a.status === "published" &&
      data.bookmarks.some((b) => b.article_id === a.id),
  );
  const follows = data.follows.some(
    (f) => f.user_id === data.user?.id && f.author_id === id,
  );
  if (!person)
    return (
      <main id="main-content" tabIndex={-1} className="standalone-page">
        <Empty
          title={loading ? "正在加载个人主页…" : "还没有找到这位创作者"}
          action={
            <Link className="button primary" href="/">
              返回首页
            </Link>
          }
        />
      </main>
    );
  return (
    <main id="main-content" tabIndex={-1} className="community-layout wide-layout">
      <Sidebar />
      <div className="profile-column">
        <div className="profile-banner">
          <span>KEEP CURIOUS. KEEP CREATING.</span>
          <i>✳</i>
          <div />
        </div>
        <section className="profile-info">
          <div className="profile-top">
            <Avatar user={person} size={88} />
            {own ? (
              <button
                className="button secondary"
                onClick={() => setEditing(true)}
              >
                <PenLine size={14} />
                编辑资料
              </button>
            ) : (
              <button
                disabled={busy}
                className={`button ${follows ? "secondary" : "primary"}`}
                onClick={async () => {
                  setBusy(true);
                  await act("follow", { id });
                  setBusy(false);
                }}
              >
                {follows ? <Check size={15} /> : <Plus size={15} />}
                {follows ? "已关注" : "关注这位作者"}
              </button>
            )}
          </div>
          <h1>
            {person.name}
            <span>{person.role}</span>
          </h1>
          <p>{person.bio}</p>
          <div className="profile-stats">
            <span>
              <strong>{articles.length}</strong>文章
            </span>
            <span>
              <strong>
                {formatCount(articles.reduce((n, a) => n + a.views, 0))}
              </strong>
              阅读
            </span>
            <span>
              <strong>
                {formatCount(
                  articles.reduce(
                    (n, a) =>
                      n +
                      a.seed_likes +
                      data.likes.filter((l) => l.article_id === a.id).length,
                    0,
                  ),
                )}
              </strong>
              获赞
            </span>
            <span>
              <strong>
                {data.follows.filter((f) => f.author_id === id).length}
              </strong>
              关注者
            </span>
          </div>
        </section>
        <section className="article-list-panel">
          <div className="feed-tabs">
            <div className="tab-group">
              <button
                className={`tab ${tab === "articles" ? "active" : ""}`}
                onClick={() => setTab("articles")}
              >
                <FileText size={15} />
                文章 <span>{articles.length}</span>
              </button>
              {own && (
                <button
                  className={`tab ${tab === "saved" ? "active" : ""}`}
                  onClick={() => setTab("saved")}
                >
                  <Bookmark size={15} />
                  收藏 <span>{saved.length}</span>
                </button>
              )}
            </div>
            <span className="feed-caption">
              {tab === "saved"
                ? "收藏仅自己可见"
                : "在文字里，看见一个人的成长"}
            </span>
          </div>
          {(tab === "saved" ? saved : articles).length ? (
            (tab === "saved" ? saved : articles).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))
          ) : (
            <Empty
              title={own ? "你的第一篇内容，即将到来" : "好内容值得等待"}
              text={
                own
                  ? "把经验写下来，让想法流动起来。"
                  : "这位创作者还没有发布文章，先关注，期待下一次分享。"
              }
              action={
                own && (
                  <Link href="/write" className="button primary">
                    写下第一篇文章
                  </Link>
                )
              }
            />
          )}
        </section>
      </div>
      {editing && (
        <Modal
          title="让大家更了解你"
          onClose={() => !busy && setEditing(false)}
        >
          <form
            className="publish-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setBusy(true);
              if (
                await act(
                  "updateProfile",
                  {
                    profile: {
                      name: form.get("name"),
                      role: form.get("role"),
                      bio: form.get("bio"),
                    },
                  },
                  "个人资料已更新",
                )
              )
                setEditing(false);
              setBusy(false);
            }}
          >
            <label>
              昵称
              <input
                name="name"
                required
                minLength={2}
                maxLength={24}
                defaultValue={person.name}
              />
            </label>
            <label>
              你的身份
              <input name="role" maxLength={30} defaultValue={person.role} />
            </label>
            <label>
              个人简介
              <textarea
                name="bio"
                rows={3}
                maxLength={160}
                defaultValue={person.bio}
              />
            </label>
            <div className="modal-actions">
              <button className="button primary" disabled={busy}>
                {busy ? <Spinner /> : <Check size={15} />}保存资料
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
