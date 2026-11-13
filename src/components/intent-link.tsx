"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  href: string;
};

function preloadReader(href: string) {
  if (!href.startsWith("/article/")) return;
  void import("./article-detail").catch(() => {});
  void import("./markdown").catch(() => {});
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
  onClick,
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
    preloadReader(href);
    setIntent(true);
  };
  return (
    <Link
      {...props}
      href={href}
      prefetch={intent}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!event.currentTarget.target ||
            event.currentTarget.target === "_self")
        ) {
          // A fast tap/programmatic click may have no hover or touch lead time.
          // Start the required reader chunks now, alongside the route request.
          preloadReader(href);
        }
      }}
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
    </Link>
  );
}
