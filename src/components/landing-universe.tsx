"use client";

import { useEffect, useRef, useState } from "react";
import { useVisualActivity } from "./landing-motion";
import styles from "./landing-visuals.module.css";

export function LandingUniverse() {
  const host = useRef<HTMLDivElement>(null);
  const { visible, animate } = useVisualActivity(host);
  const [state, setState] = useState<"idle" | "ready" | "fallback">("idle");
  const engine = useRef<import("./universe-engine").UniverseEngine | null>(
    null,
  );
  const active = useRef(animate);
  useEffect(() => {
    active.current = animate;
    engine.current?.setActive(animate);
  }, [animate]);
  useEffect(() => {
    if (!visible || !host.current) return;
    let cancelled = false;
    const element = host.current;
    const timer = window.setTimeout(() => {
      import("./universe-engine")
        .then(({ createUniverse }) => {
          if (cancelled) return;
          const scene = createUniverse(element, () => {
            if (!cancelled) setState("fallback");
          });
          if (!scene) {
            setState("fallback");
            return;
          }
          engine.current = scene;
          scene.setActive(active.current);
          setState("ready");
        })
        .catch(() => {
          if (!cancelled) setState("fallback");
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      engine.current?.dispose();
      engine.current = null;
    };
  }, [visible]);

  return (
    <div
      className={styles.universe}
      ref={host}
      data-universe={state}
      aria-hidden="true"
    >
      <div className={styles.universeHalo} />
      <svg
        className={styles.universeFallback}
        viewBox="0 0 600 560"
        fill="none"
      >
        <defs>
          <radialGradient id="planet-fill">
            <stop stopColor="#b9f4e2" stopOpacity=".12" />
            <stop offset="1" stopColor="#a5c5ff" stopOpacity=".02" />
          </radialGradient>
        </defs>
        <circle
          cx="300"
          cy="280"
          r="172"
          fill="url(#planet-fill)"
          stroke="#b9f4e2"
          strokeOpacity=".45"
        />
        {[55, 110, 155].map((radius) => (
          <ellipse
            key={radius}
            cx="300"
            cy="280"
            rx={radius}
            ry="172"
            stroke="#b6d3ff"
            strokeOpacity=".24"
          />
        ))}
        {[60, 110, 150].map((radius) => (
          <ellipse
            key={radius}
            cx="300"
            cy="280"
            rx="172"
            ry={radius}
            stroke="#b6d3ff"
            strokeOpacity=".24"
          />
        ))}
        <ellipse
          cx="300"
          cy="280"
          rx="263"
          ry="96"
          transform="rotate(-28 300 280)"
          stroke="#b9f4e2"
          strokeOpacity=".5"
        />
        <ellipse
          cx="300"
          cy="280"
          rx="225"
          ry="125"
          transform="rotate(38 300 280)"
          stroke="#b6d3ff"
          strokeOpacity=".25"
        />
        {[
          [168, 170],
          [406, 148],
          [434, 357],
          [205, 407],
          [300, 108],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="5" fill="#c2f6e7" />
        ))}
      </svg>
      <span className={`${styles.orbitLabel} ${styles.labelFrontend}`}>
        前端开发 <span>↗</span>
      </span>
      <span className={`${styles.orbitLabel} ${styles.labelAI}`}>
        人工智能 <span>✳</span>
      </span>
      <span className={`${styles.orbitLabel} ${styles.labelBackend}`}>
        后端工程 <span>↗</span>
      </span>
      <div className={styles.universeCaption}>
        <span className={styles.liveDot} /> IDEAS IN ORBIT{" "}
        <span>知识相遇，灵感生长</span>
      </div>
    </div>
  );
}
