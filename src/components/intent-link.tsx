"use client";

import Link, { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import styles from "./intent-link.module.css";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  href: string;
};

function PendingHint() {
  const { pending } = useLinkStatus();
  return pending
    ? createPortal(
        <span className={styles.pending} role="status">
          <span className={styles.bar} aria-hidden="true" />
          <span className={styles.message}>正在打开页面…</span>
        </span>,
        document.body,
      )
    : null;
}

// Dynamic catch-all pages have no loading boundary (to preserve HTTP 404).
// Prefetch only an intended link, not every visible article and its sidebar.
export function IntentLink({
  href,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onTouchStart,
  ...props
}: Props) {
  const [intent, setIntent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => {
    clearTimeout(timer.current);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const warm = () => {
    if (!href.startsWith("/") || href.startsWith("//")) return;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData || connection?.effectiveType?.includes("2g"))
      return;
    // Fetch the reading chunks in parallel with the RSC payload, instead of
    // waiting for navigation -> ArticleDetail -> Markdown to load in sequence.
    if (href.startsWith("/article/")) {
      void import("./article-detail").catch(() => {});
      void import("./markdown").catch(() => {});
    }
    setIntent(true);
  };
  return (
    <Link
      {...props}
      href={href}
      prefetch={intent}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        cancel();
        timer.current = setTimeout(warm, 100);
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        cancel();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        cancel();
        warm();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        cancel();
        warm();
      }}
    >
      {children}
      <PendingHint />
    </Link>
  );
}
