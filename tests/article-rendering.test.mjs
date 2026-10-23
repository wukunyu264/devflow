import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

// Exercise the real article effects with a deterministic browser scheduler.
// Unchanged DOM mutations must settle instead of feeding React another render.
function mountArticleEffects() {
  const effects = [],
    states = [],
    frames = new Map(),
    listeners = new Map();
  let observerCallback,
    stateIndex = 0,
    nextFrame = 0,
    scans = 0,
    updates = 0;
  let nodes = [
    {
      textContent: "First heading",
      id: "first",
      tagName: "H2",
      getBoundingClientRect: () => ({ top: 100 }),
    },
  ];
  const container = {
    querySelectorAll: () => {
      scans++;
      return nodes;
    },
  };
  const document = {
    documentElement: { scrollHeight: 2000 },
    querySelector: () => container,
    querySelectorAll: () => {
      scans++;
      return nodes;
    },
  };
  const window = {
    innerHeight: 800,
    scrollY: 0,
    scrollTo() {},
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const require = createRequire(import.meta.url);
  const mockRequire = (name) => {
    if (name === "react")
      return {
        useEffect: (fn) => effects.push(fn),
        useRef: (value) => ({ current: value }),
        useState: (initial) => {
          const index = stateIndex++;
          states[index] = initial;
          return [
            initial,
            (value) => {
              const next =
                typeof value === "function" ? value(states[index]) : value;
              if (!Object.is(states[index], next)) {
                states[index] = next;
                updates++;
              }
            },
          ];
        },
      };
    if (name === "react/jsx-runtime") return require(name);
    if (name === "./community-provider")
      return {
        useCommunity: () => ({
          data: { user: null, article: null },
          loading: false,
        }),
      };
    return new Proxy({}, { get: () => () => null });
  };
  const exports = {};
  const source = readFileSync(
    new URL("../src/components/article-detail.tsx", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const raf = (fn) => {
    const id = ++nextFrame;
    frames.set(id, fn);
    return id;
  };
  const Observer = class {
    constructor(fn) {
      observerCallback = fn;
    }
    observe() {}
    disconnect() {
      observerCallback = null;
    }
  };
  new Function(
    "require",
    "exports",
    "window",
    "document",
    "MutationObserver",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    outputText,
  )(mockRequire, exports, window, document, Observer, raf, (id) =>
    frames.delete(id),
  );
  exports.ArticleDetail({ id: "test-article" });
  const cleanup = effects[1]();
  return {
    flush() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((fn) => fn());
    },
    mutate() {
      observerCallback?.([]);
    },
    scroll() {
      listeners.get("scroll")?.();
    },
    setNodes(value) {
      nodes = value;
    },
    cleanup,
    get scans() {
      return scans;
    },
    get updates() {
      return updates;
    },
    get headings() {
      return states[2];
    },
    get pending() {
      return frames.size;
    },
    get listeners() {
      return listeners.size;
    },
  };
}

test("article outline settles after repeated identical DOM mutations", () => {
  const browser = mountArticleEffects();
  browser.flush();
  const updates = browser.updates;
  for (let i = 0; i < 50; i++) {
    browser.mutate();
    browser.flush();
  }
  assert.equal(
    browser.updates,
    updates,
    "unchanged headings must not trigger React renders",
  );
  browser.cleanup();
});

test("article scroll is batched and reuses heading nodes; pending work cleans up", () => {
  const browser = mountArticleEffects();
  browser.flush();
  const scans = browser.scans;
  for (let i = 0; i < 100; i++) browser.scroll();
  assert.equal(
    browser.pending,
    1,
    "100 scroll events should schedule one frame",
  );
  browser.flush();
  assert.equal(
    browser.scans,
    scans,
    "scrolling should not rescan the article DOM",
  );
  browser.setNodes([
    {
      textContent: "New heading",
      id: "new",
      tagName: "H3",
      getBoundingClientRect: () => ({ top: 120 }),
    },
  ]);
  browser.mutate();
  browser.flush();
  assert.equal(
    browser.headings[0].id,
    "new",
    "lazy Markdown completion must update the outline",
  );
  browser.scroll();
  browser.cleanup();
  assert.equal(browser.pending, 0);
  assert.equal(browser.listeners, 0);
});
