"use client";
import Link from "next/link";
import {
  ArrowRight,
  Atom,
  Braces,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Network,
  Terminal,
  Sparkles,
  X,
  LoaderCircle,
  BookOpen,
} from "lucide-react";
import type { Article, ArticleSummary, Profile } from "@/lib/types";
import type { ReactNode } from "react";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="DevFlow 首页"
    >
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      <strong>
        Dev<span>Flow</span>
        <i />
      </strong>
    </Link>
  );
}
export function Avatar({
  user,
  size = 32,
}: {
  user?: Profile | null;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: user?.color || "#d6e9d9",
        fontSize: size * 0.37,
      }}
      aria-label={user?.name || "创作者"}
    >
      <span>{user?.name?.slice(0, 1) || "D"}</span>
      <i />
    </span>
  );
}
const coverIcons = {
  react: Atom,
  ai: Sparkles,
  typescript: Braces,
  next: Layers,
  css: Code2,
  agent: Network,
  java: Code2,
  python: Terminal,
  database: Database,
  git: GitBranch,
  architecture: Network,
  terminal: Terminal,
  none: BookOpen,
};
const coverLabels: Record<string, [string, string]> = {
  react: ["React", "THINK IN COMPONENTS"],
  ai: ["Beyond the prompt.", "BUILD WITH AI"],
  typescript: ["TypeScript", "MAKE THE IMPOSSIBLE IMPOSSIBLE"],
  next: ["Next.js", "THE REACT FRAMEWORK"],
  css: ["Less. But better.", "THE ART OF CSS"],
  agent: ["Agents at work.", "TOOLS · REASONING · ACTION"],
  java: ["Build to last.", "JAVA / ENGINEERING"],
  python: ["Life is short.", "WRITE PYTHON"],
  database: ["Data, by design.", "QUERY · INDEX · OPTIMIZE"],
  git: ["Commit to better.", "A DEVELOPER’S WORKFLOW"],
  architecture: ["Connect the dots.", "SYSTEM DESIGN"],
  terminal: ["$ make something", "DEVELOPER TOOLKIT"],
  none: ["Ideas in motion.", "DEVFLOW COMMUNITY"],
};
export function Cover({
  kind = "none",
  large = false,
}: {
  kind?: string;
  large?: boolean;
}) {
  const Icon = coverIcons[kind as keyof typeof coverIcons] || Cpu;
  const label = coverLabels[kind] || coverLabels.none;
  return (
    <div
      className={`article-cover cover-${kind} ${large ? "cover-large" : ""}`}
      aria-hidden="true"
    >
      <span className="cover-grid" />
      <span className="cover-orbit orbit-one" />
      <span className="cover-orbit orbit-two" />
      <Icon className="cover-icon" strokeWidth={1.25} />
      <div className="cover-type">
        <small>{label[1]}</small>
        <strong>{label[0]}</strong>
      </div>
      <span className="cover-dot" />
    </div>
  );
}
export function Empty({
  title = "这里还在等待新的灵感",
  text = "试试其他关键词，或写下你的第一篇文章。",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <BookOpen size={28} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Spinner() {
  return <LoaderCircle className="spin" size={17} />;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="关闭"
            onClick={onClose}
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  });
}
export function readTime(article: Article | ArticleSummary) {
  return "reading_minutes" in article ? article.reading_minutes : Math.max(2, Math.ceil(article.content.length / 450));
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowRight size={14} />
    </Link>
  );
}
