"use client";
import Markdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "@/lib/highlight";
import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Root, Element, RootContent } from "hast";
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}
export function getHeadings(content: string) {
  let insideCode = false;
  const counts = new Map<string, number>();
  return content.split("\n").flatMap((line) => {
    if (/^\s*```/.test(line)) insideCode = !insideCode;
    if (insideCode) return [];
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) return [];
    const base = headingId(match[2]);
    const n = counts.get(base) || 0;
    counts.set(base, n + 1);
    return [
      {
        title: match[2],
        id: n ? `${base}-${n}` : base,
        level: match[1].length,
      },
    ];
  });
}
function headingIds() {
  return (tree: Root) => {
    const counts = new Map<string, number>();
    const text = (node: Root | RootContent): string =>
      "value" in node
        ? node.value
        : "children" in node
          ? node.children.map(text).join("")
          : "";
    const walk = (node: Root | RootContent) => {
      if (node.type === "element" && ["h2", "h3"].includes(node.tagName)) {
        const base = headingId(text(node));
        const n = counts.get(base) || 0;
        counts.set(base, n + 1);
        (node as Element).properties.id = n ? `${base}-${n}` : base;
      }
      if ("children" in node) node.children.forEach(walk);
    };
    walk(tree);
  };
}
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node)
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}
function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>
          <i />
          <i />
          <i />
        </span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(textOf(children));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              toast.error("复制失败，请手动选择代码。");
            }
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "已复制" : "复制代码"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, headingIds]}
        components={{
          h2: ({ children, id }) => <h2 id={id}>{children}</h2>,
          h3: ({ children, id }) => <h3 id={id}>{children}</h3>,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ alt, src }) => typeof src === "string" ? (
            <Image src={src} alt={alt || "文章配图"} width={1200} height={800} unoptimized loading="lazy" style={{width:"100%",height:"auto"}} />
          ) : null,
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
