"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const MotionPaused = createContext(false);

export function useVisualActivity(
  ref: RefObject<HTMLElement | null>,
  rootMargin = "0px",
) {
  const paused = useContext(MotionPaused);
  const [activity, setActivity] = useState({
    visible: false,
    hidden: false,
    reduced: false,
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setActivity({
        visible,
        hidden: document.hidden,
        reduced: preference.matches,
      });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin },
    );
    observer.observe(element);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, rootMargin]);
  return {
    visible: activity.visible,
    animate:
      activity.visible && !activity.hidden && !activity.reduced && !paused,
  };
}

export function LandingMotion({
  children,
  className,
  controlClassName,
}: {
  children: ReactNode;
  className: string;
  controlClassName: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const container = root.current;
    if (!container || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (target.hasAttribute("data-landing-animate")) {
            target.dataset.active = String(entry.isIntersecting);
          } else if (entry.isIntersecting) {
            target.dataset.visible = "true";
            observer.unobserve(target);
          }
        }
      },
      { threshold: 0.08 },
    );
    for (const element of container.querySelectorAll<HTMLElement>(
      "[data-landing-reveal]",
    )) {
      if (element.getBoundingClientRect().top < window.innerHeight)
        element.dataset.visible = "true";
      else observer.observe(element);
    }
    for (const element of container.querySelectorAll("[data-landing-animate]"))
      observer.observe(element);
    const syncPreference = () => {
      container.dataset.motion = preference.matches ? "reduced" : "on";
    };
    const syncVisibility = () => {
      container.dataset.tabHidden = String(document.hidden);
    };
    syncPreference();
    syncVisibility();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return (
    <MotionPaused.Provider value={paused}>
      <div
        ref={root}
        className={className}
        data-landing-root
        data-user-paused={paused}
      >
        {children}
        <button
          className={controlClassName}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "播放首页动画" : "暂停首页动画"}
          aria-pressed={paused}
        >
          {paused ? (
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="m5 3 8 5-8 5Z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor" />
            </svg>
          )}
          <span>{paused ? "播放动画" : "暂停动画"}</span>
        </button>
      </div>
    </MotionPaused.Provider>
  );
}
