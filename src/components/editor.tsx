"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import {
  ArrowLeft,
  ArrowUpRight,
  Bold,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  Eye,
  Heading2,
  Image,
  Italic,
  Link2,
  List,
  Maximize2,
  Minimize2,
  PenLine,
  Quote,
  Save,
  Send,
  Settings2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { request, useCommunity } from "./community-provider";
import { Cover, Empty, Modal, Spinner } from "./ui";
import { MarkdownContent } from "./markdown";
import { categories, type Article } from "@/lib/types";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  {
    ssr: false,
    loading: () => <div className="editor-loading">正在准备编辑器…</div>,
  },
);
type DraftFields = {
  title: string;
  content: string;
  category: Article["category"];
  tags: string;
  excerpt: string;
  cover: string;
};
const blank: DraftFields = {
  title: "",
  content: "",
  category: "frontend",
  tags: "",
  excerpt: "",
  cover: "none",
};
export function Editor() {
  const { data, loading, refresh, dark } = useCommunity();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const [fields, setFields] = useState<DraftFields>(blank);
  const [currentId, setCurrentId] = useState<string | null>(editId);
  const [mode, setMode] = useState<"edit" | "split" | "preview">("edit");
  const [full, setFull] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("尚未保存");
  const [restored, setRestored] = useState(false);
  const editorView = useRef<EditorView | null>(null);
  const initialized = useRef("");
  const lastSaved = useRef("");
  const current = data.articles.find((a) => a.id === editId);
  const backupKey = `df-draft-${data.user?.id}-${editId || "new"}`;
  useEffect(() => {
    if (loading || !data.user || initialized.current === backupKey) return;
    initialized.current = backupKey;
    let initial: DraftFields = current
      ? {
          title: current.title,
          content: current.content,
          category: current.category,
          tags: current.tags.join(", "),
          excerpt: current.excerpt,
          cover: current.cover,
        }
      : blank;
    lastSaved.current = JSON.stringify(initial);
    setRestored(false);
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      try {
        const value = JSON.parse(backup);
        if (
          (!current || value.time > new Date(current.updated_at).getTime()) &&
          JSON.stringify(value.fields) !== lastSaved.current
        ) {
          initial = value.fields;
          setRestored(true);
          setSaved("已恢复浏览器备份");
        } else {
          localStorage.removeItem(backupKey);
          setSaved(current ? "已保存到数据库" : "尚未保存");
        }
      } catch {
        localStorage.removeItem(backupKey);
      }
    } else setSaved(current ? "已保存到数据库" : "尚未保存");
    setFields(initial);
    setCurrentId(editId);
  }, [loading, data.user, backupKey, current, editId]);
  useEffect(() => {
    if (
      !data.user ||
      initialized.current !== backupKey ||
      (!fields.title && !fields.content) ||
      JSON.stringify(fields) === lastSaved.current
    )
      return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        backupKey,
        JSON.stringify({ fields, time: Date.now() }),
      );
      setSaved("浏览器备份已更新");
    }, 1000);
    return () => clearTimeout(timer);
  }, [fields, backupKey, data.user]);
  const save = async (status: "draft" | "published") => {
    if (busy) return;
    if (!fields.title.trim()) {
      toast.error("先给你的文章起个标题吧");
      return;
    }
    setBusy(true);
    try {
      const result = await request("saveArticle", {
        article: {
          ...fields,
          id: currentId || undefined,
          tags: fields.tags
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean),
          status,
        },
      });
      lastSaved.current = JSON.stringify(fields);
      setSaved("已保存到数据库");
      setRestored(false);
      localStorage.removeItem(backupKey);
      setCurrentId(result.id!);
      await refresh();
      if (status === "published") {
        toast.success("发布成功！你的想法已经开始流动。");
        router.push(`/article/${result.id}`);
      } else {
        toast.success("草稿已保存到数据库");
        router.replace(`/write?edit=${result.id}`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current("draft");
      }
      if (e.key === "Escape") setFull(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const change = <K extends keyof DraftFields>(key: K, value: DraftFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));
  const insert = (before: string, after = "") => {
    const view = editorView.current;
    if (!view) return;
    const selection = view.state.selection.main;
    const text = view.state.sliceDoc(selection.from, selection.to) || "内容";
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: before + text + after,
      },
      selection: {
        anchor: selection.from + before.length,
        head: selection.from + before.length + text.length,
      },
    });
    view.focus();
  };
  if (loading)
    return (
      <main className="standalone-page">
        <div className="skeleton skeleton-large" />
      </main>
    );
  if (!data.user)
    return (
      <main className="standalone-page">
        <Empty
          title="每一份经验，都值得被记录"
          text="登录你的账号，开始创作。草稿、发布和管理，都在这里。"
          action={
            <Link
              href={`/login?next=${encodeURIComponent(`/write${editId ? `?edit=${editId}` : ""}`)}`}
              className="button primary"
            >
              登录并开始创作 <PenLine size={16} />
            </Link>
          }
        />
      </main>
    );
  if (editId && (!current || current.author_id !== data.user.id))
    return (
      <main className="standalone-page">
        <Empty
          title="无法编辑这篇文章"
          text="文章不存在，或你没有编辑权限。"
          action={
            <Link href="/dashboard" className="button primary">
              返回创作中心
            </Link>
          }
        />
      </main>
    );
  return (
    <main className={`editor-page ${full ? "editor-fullscreen" : ""}`}>
      <div className="editor-top">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft size={17} />
          <span>创作中心</span>
        </Link>
        <div className="editor-save-status">
          <span className={saved.includes("数据库") ? "saved-dot" : ""} />
          {saved}
        </div>
        <div className="editor-top-actions">
          <button
            className="button secondary small"
            disabled={busy}
            onClick={() => save("draft")}
          >
            {busy ? <Spinner /> : <Save size={14} />}保存草稿
          </button>
          <button
            className="button primary small"
            disabled={busy}
            onClick={() => setPublishing(true)}
          >
            <Send size={14} />
            {current?.status === "published" ? "更新文章" : "发布文章"}
          </button>
        </div>
      </div>
      <div className="editor-heading">
        <span className="eyebrow">TURN YOUR IDEAS INTO SOMETHING</span>
        <p>不用等到完美，先把想法写下来。</p>
      </div>
      {restored && (
        <div className="backup-notice">
          <Check size={14} />
          已恢复上次未保存的浏览器备份，发布前请确认内容。
          <button aria-label="关闭备份提示" onClick={() => setRestored(false)}>
            <X size={14} />
          </button>
        </div>
      )}
      <input
        className="editor-title"
        placeholder="在这里，写下你的标题…"
        aria-label="文章标题"
        value={fields.title}
        onChange={(e) => change("title", e.target.value)}
        maxLength={120}
      />
      <div className="editor-toolbar">
        <div className="format-tools">
          <button
            title="二级标题"
            aria-label="插入标题"
            onClick={() => insert("\n## ", "\n")}
          >
            <Heading2 size={18} />
          </button>
          <button
            title="加粗"
            aria-label="加粗"
            onClick={() => insert("**", "**")}
          >
            <Bold size={17} />
          </button>
          <button
            title="斜体"
            aria-label="斜体"
            onClick={() => insert("*", "*")}
          >
            <Italic size={17} />
          </button>
          <i />
          <button
            title="引用"
            aria-label="插入引用"
            onClick={() => insert("\n> ", "\n")}
          >
            <Quote size={17} />
          </button>
          <button
            title="列表"
            aria-label="插入列表"
            onClick={() => insert("\n- ", "\n")}
          >
            <List size={18} />
          </button>
          <button
            title="代码块"
            aria-label="插入代码块"
            onClick={() => insert("\n```typescript\n", "\n```\n")}
          >
            <Code2 size={18} />
          </button>
          <button
            title="链接"
            aria-label="插入链接"
            onClick={() => insert("[", "](https://example.com)")}
          >
            <Link2 size={17} />
          </button>
          <button
            title="图片"
            aria-label="插入图片"
            onClick={() => insert("![", "](https://example.com/image.png)")}
          >
            <Image size={17} />
          </button>
        </div>
        <div className="editor-view-tools">
          <button
            className={mode === "edit" ? "active" : ""}
            title="编辑模式"
            aria-label="编辑模式"
            onClick={() => setMode("edit")}
          >
            <PenLine size={16} />
          </button>
          <button
            className={mode === "split" ? "active" : ""}
            title="分屏预览"
            aria-label="分屏预览"
            onClick={() => setMode("split")}
          >
            <Columns2 size={16} />
          </button>
          <button
            className={mode === "preview" ? "active" : ""}
            title="预览模式"
            aria-label="预览模式"
            onClick={() => setMode("preview")}
          >
            <Eye size={17} />
          </button>
          <i />
          <button
            title="全屏编辑"
            aria-label={full ? "退出全屏" : "全屏编辑"}
            onClick={() => setFull(!full)}
          >
            {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      <div className={`editor-workspace mode-${mode}`}>
        {mode !== "preview" && (
          <div className="editor-code">
            <CodeMirror
              value={fields.content}
              onChange={(value) => change("content", value)}
              theme={dark ? "dark" : "light"}
              extensions={[
                markdown(),
                EditorView.contentAttributes.of({
                  "aria-label": "Markdown 正文",
                }),
              ]}
              minHeight="520px"
              placeholder="从一个想法开始。支持 Markdown，试试 ## 标题、代码块或引用…"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
              }}
              onCreateEditor={(view) => {
                editorView.current = view;
              }}
            />
          </div>
        )}
        {mode !== "edit" && (
          <div className="editor-preview">
            {fields.content ? (
              <MarkdownContent content={fields.content} />
            ) : (
              <Empty
                title="你的灵感，即将呈现"
                text="在左侧写点什么，这里会实时展示。"
              />
            )}
          </div>
        )}
      </div>
      <div className="editor-statusbar">
        <span>
          Markdown <span>·</span> {fields.content.length.toLocaleString()} 字符{" "}
          <span>·</span> 约{" "}
          {Math.max(1, Math.ceil(fields.content.length / 450))} 分钟阅读
        </span>
        <span>Ctrl / ⌘ + S 保存草稿</span>
      </div>
      {publishing && (
        <Modal
          title={
            current?.status === "published"
              ? "让这份分享更完整"
              : "准备好，分享你的灵感"
          }
          onClose={() => !busy && setPublishing(false)}
        >
          <p className="modal-description">
            选一个合适的分类，让感兴趣的人更容易找到它。
          </p>
          <form
            className="publish-form"
            onSubmit={(e) => {
              e.preventDefault();
              save("published");
            }}
          >
            <label>
              文章分类
              <select
                value={fields.category}
                onChange={(e) =>
                  change("category", e.target.value as Article["category"])
                }
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              文章标签 <small>最多 4 个，使用逗号分隔</small>
              <input
                placeholder="例如：React, 前端进阶"
                value={fields.tags}
                onChange={(e) => change("tags", e.target.value)}
              />
            </label>
            <label>
              内容摘要 <small>选填，最多 250 字</small>
              <textarea
                rows={3}
                maxLength={250}
                placeholder="用几句话，介绍文章最值得读的地方。留空则自动提取。"
                value={fields.excerpt}
                onChange={(e) => change("excerpt", e.target.value)}
              />
            </label>
            <label>
              文章封面 <small>选择一个适合内容的主题</small>
            </label>
            <div className="cover-picker">
              {[
                "none",
                "react",
                "ai",
                "typescript",
                "database",
                "architecture",
              ].map((kind) => (
                <button
                  type="button"
                  aria-label={`选择${kind}封面`}
                  className={fields.cover === kind ? "selected" : ""}
                  key={kind}
                  onClick={() => change("cover", kind)}
                >
                  <Cover kind={kind} />
                  {fields.cover === kind && (
                    <span>
                      <Check size={13} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="publish-footer">
              <span>分享真实经验，让技术沉淀。</span>
              <button className="button primary" disabled={busy}>
                {busy ? <Spinner /> : <Send size={15} />}
                {busy
                  ? "正在保存…"
                  : current?.status === "published"
                    ? "确认更新"
                    : "确认发布"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
