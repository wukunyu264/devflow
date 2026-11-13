"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export function useVisualActivity(
  ref: RefObject<HTMLElement | null>,
  rootMargin = "0px",
) {
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
    animate: activity.visible && !activity.hidden && !activity.reduced,
  };
}

export function LandingMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const root = useRef<HTMLDivElement>(null);

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
    <div ref={root} className={className} data-landing-root>
      {children}
    </div>
  );
}
