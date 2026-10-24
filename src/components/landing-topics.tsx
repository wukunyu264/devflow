"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TopicGraph } from "@/lib/topic-graph";
import { categories } from "@/lib/types";
import { useVisualActivity } from "./landing-motion";
import type { PlacedTopic } from "./topic-layout";
import styles from "./landing-visuals.module.css";

const colors = {
  frontend: "#365ce5",
  backend: "#598679",
  ai: "#8560bf",
  java: "#b37854",
  python: "#568ca6",
  database: "#b08739",
  tools: "#63718e",
  architecture: "#bd7182",
};

export function LandingTopics() {
  const host = useRef<HTMLDivElement>(null);
  const { visible } = useVisualActivity(host, "120px");
  const [data, setData] = useState<TopicGraph | null>(null);
  const [nodes, setNodes] = useState<PlacedTopic[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [hoverId, setHoverId] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible || data) return;
    const controller = new AbortController();
    // Loading and errors stay local to the map; the portal never waits on data.
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    Promise.all([
      fetch("/api/topics", {
        signal: controller.signal,
        credentials: "omit",
      }).then(async (response) => {
        if (!response.ok) throw new Error("Topics unavailable");
        return response.json() as Promise<TopicGraph>;
      }),
      import("./topic-layout"),
    ])
      .then(([graph, { layoutTopics }]) => {
        if (controller.signal.aborted) return;
        setNodes(layoutTopics(graph, (host.current?.clientWidth ?? 760) < 540));
        setData(graph);
        setError(false);
      })
      .catch(() => {
        // A timeout is an error; cancellation on unmount/scroll is not.
        if (!cancelled) setError(true);
      })
      .finally(() => window.clearTimeout(timeout));
    let cancelled = false;
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [visible, data, attempt]);

  useEffect(() => {
    const element = host.current;
    if (!data || !element) return;
    let current = element.clientWidth < 540;
    let cancelled = false;
    const observer = new ResizeObserver(() => {
      const compact = element.clientWidth < 540;
      if (compact === current) return;
      current = compact;
      import("./topic-layout").then(({ layoutTopics }) => {
        if (!cancelled) setNodes(layoutTopics(data, compact));
      });
    });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [data]);

  const selected =
    data?.nodes.find((node) => node.id === selectedId) ?? data?.nodes[0];
  const highlighted = hoverId || selected?.id;
  const adjacent = new Set([highlighted]);
  for (const link of data?.links ?? []) {
    if (link.source === highlighted) adjacent.add(link.target);
    if (link.target === highlighted) adjacent.add(link.source);
  }
  const positions = new Map(nodes.map((node) => [node.id, node]));
  const compact = nodes[0]?.compact ?? false;
  const related =
    data?.articles.filter((article) =>
      selected?.articleIds.includes(article.id),
    ) ?? [];
  return (
    <section
      id="knowledge"
      className={styles.topics}
      aria-labelledby="knowledge-title"
      data-topic-map
    >
      <div className={styles.mapHeading}>
        <div>
          <p className={styles.mapEyebrow}>01 / THE KNOWLEDGE ATLAS</p>
          <h2 id="knowledge-title">
            每个想法，都有回响<span>。</span>
          </h2>
        </div>
        <p>
          沿着一个标签，发现下一篇好文章。
          <br />
          让知识的连接，看得见。
        </p>
      </div>
      <div className={styles.mapShell} ref={host}>
        <div className={styles.mapCanvas} aria-busy={!data && !error}>
          <div className={styles.mapToolbar}>
            <span>
              <i /> 技术知识地图
            </span>
            <span>标签之间的线，代表共同出现</span>
          </div>
          {data && nodes.length > 0 ? (
            <svg
              className={styles.graph}
              viewBox={compact ? "0 0 380 460" : "0 0 760 500"}
              style={{ aspectRatio: compact ? "380 / 460" : "760 / 500" }}
              role="group"
              aria-label="技术标签关系图，点击标签查看文章"
            >
              <defs>
                <radialGradient id="atlas-glow">
                  <stop stopColor="#e7ecff" />
                  <stop offset="1" stopColor="#fafbfe" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle
                cx={compact ? 190 : 380}
                cy={compact ? 230 : 245}
                r={compact ? 180 : 230}
                fill="url(#atlas-glow)"
              />
              {(compact ? [80, 140, 190] : [110, 190, 270]).map((radius) => (
                <circle
                  key={radius}
                  cx={compact ? 190 : 380}
                  cy={compact ? 230 : 245}
                  r={radius}
                  fill="none"
                  stroke="#e7ebf4"
                  strokeDasharray="3 7"
                />
              ))}
              <g aria-hidden="true">
                {data.links.map((link) => {
                  const source = positions.get(link.source),
                    target = positions.get(link.target);
                  if (!source || !target) return null;
                  const active =
                    link.source === highlighted || link.target === highlighted;
                  return (
                    <line
                      key={JSON.stringify([link.source, link.target])}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={active ? "#7189db" : "#dce2ed"}
                      strokeWidth={Math.min(3, 0.8 + link.count * 0.35)}
                      opacity={active ? 0.75 : 0.5}
                    />
                  );
                })}
              </g>
              {nodes.map((node) => (
                <g
                  key={node.id}
                  className={styles.topicNode}
                  transform={`translate(${node.x},${node.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label}，${node.count} 篇文章`}
                  aria-pressed={selected?.id === node.id}
                  data-related={adjacent.has(node.id)}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId("")}
                  onFocus={() => setHoverId(node.id)}
                  onBlur={() => setHoverId("")}
                >
                  <title>
                    {node.label} · {node.count} 篇文章
                  </title>
                  <circle
                    r={node.radius + 7}
                    fill="none"
                    stroke={colors[node.category]}
                    strokeOpacity={selected?.id === node.id ? 0.45 : 0}
                  />
                  <circle
                    r={node.radius}
                    fill={
                      selected?.id === node.id ? colors[node.category] : "#fff"
                    }
                    stroke={colors[node.category]}
                    strokeOpacity=".35"
                  />
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fill={
                      selected?.id === node.id ? "#fff" : colors[node.category]
                    }
                    className={styles.nodeCount}
                  >
                    {node.count}
                  </text>
                  <text
                    textAnchor="middle"
                    y={node.radius + 19}
                    className={styles.nodeLabel}
                  >
                    {node.label.length > 12
                      ? `${node.label.slice(0, 11)}…`
                      : node.label}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <div className={styles.mapPlaceholder} role="status">
              <div className={styles.placeholderOrbits}>
                <span />
                <span />
                <span />
                <i />
              </div>
              <p>
                {error
                  ? "知识地图暂时无法加载"
                  : data
                    ? "第一篇分享，将点亮这里"
                    : "连接每一份技术经验"}
              </p>
              <small>
                {error
                  ? "你仍然可以进入社区阅读文章。"
                  : data
                    ? "发布带有标签的文章，建立新的连接。"
                    : "向下探索时，加载社区的真实标签。"}
              </small>
              {error && (
                <button
                  onClick={() => {
                    setError(false);
                    setAttempt((value) => value + 1);
                  }}
                >
                  重新加载 ↻
                </button>
              )}
              {data && <Link href="/write#top">开始创作 ↗</Link>}
            </div>
          )}
          <div className={styles.mapLegend}>
            <span>
              <i /> 节点越大，相关文章越多
            </span>
            <span>
              {data
                ? `最近 ${data.articleCount} 篇已发布文章 · ${data.tagCount} 个标签`
                : "只展示已发布内容"}
            </span>
          </div>
        </div>
        <aside className={styles.mapDetails} aria-label="标签相关文章">
          <p className={styles.detailEyebrow}>FOLLOW A THREAD</p>
          <h3>
            {selected?.label ?? "从一次好奇开始"}
            <span>↗</span>
          </h3>
          <p className={styles.detailIntro}>
            {selected
              ? `在最近 ${data!.articleCount} 篇文章中，找到 ${selected.count} 篇关于 ${selected.label} 的分享。`
              : "点击地图中的标签，让一篇文章带你发现更多。"}
          </p>
          <div
            className={styles.relatedArticles}
            aria-live="polite"
            aria-atomic="true"
          >
            {related.slice(0, 4).map((article, index) => (
              <Link
                href={`/article/${article.id}#top`}
                key={article.id}
                prefetch={false}
              >
                <span className={styles.relatedIndex}>0{index + 1}</span>
                <div>
                  <small>
                    {
                      categories.find(
                        (category) => category.slug === article.category,
                      )?.label
                    }
                  </small>
                  <strong>{article.title}</strong>
                </div>
                <span className={styles.relatedArrow}>↗</span>
              </Link>
            ))}
            {!selected && (
              <p className={styles.detailEmpty}>
                前端、后端、AI、工程实践……
                <br />
                下一份灵感，就藏在这些连接里。
              </p>
            )}
          </div>
          <Link
            className={styles.browseTopics}
            href={
              selected
                ? `/search?q=${encodeURIComponent(selected.label)}#top`
                : "/community#top"
            }
            prefetch={false}
          >
            {selected ? "继续探索这个话题" : "浏览全部文章"}
            <span>→</span>
          </Link>
        </aside>
      </div>
      <div className={styles.topicChips} aria-label="按标签选择文章">
        {data?.nodes.slice(0, 10).map((node) => (
          <button
            key={node.id}
            aria-pressed={selected?.id === node.id}
            onClick={() => setSelectedId(node.id)}
          >
            # {node.label}
            <span>{node.count}</span>
          </button>
        ))}
      </div>
      <noscript>
        <p className={styles.noScript}>
          开启 JavaScript 可探索交互地图，也可以直接
          <Link href="/community#top">进入技术社区阅读文章</Link>。
        </p>
      </noscript>
    </section>
  );
}
