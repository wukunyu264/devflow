import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Run the production aggregation function without a database or a second copy
// of its implementation. Its only import is type-only and erases at runtime.
const compiled = ts.transpileModule(
  readFileSync(new URL("../src/lib/topic-graph.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const exported = {};
new Function("exports", compiled)(exported);
const { buildTopicGraph } = exported;
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const article = (id, tags, status = "published") => ({
  id,
  tags,
  status,
  title: "Article " + id,
  category: "frontend",
  content: "PRIVATE_BODY",
});

test("topic graph counts real co-occurrence once per published article and excludes private fields", () => {
  const graph = buildTopicGraph([
    article("a", ["React", "react", "TypeScript", " "]),
    article("b", ["React", "Next.js"]),
    article("private", ["Secret"], "draft"),
    article("c", ["Vue"]),
  ]);
  assert.equal(graph.articleCount, 3);
  assert.equal(graph.nodes.find((node) => node.id === "react").count, 2);
  assert.equal(
    graph.links.find(
      (link) => link.source === "react" && link.target === "typescript",
    ).count,
    1,
  );
  assert.ok(
    !graph.links.some((link) => link.source === "vue" || link.target === "vue"),
    "Do not invent links between unrelated articles",
  );
  assert.ok(!JSON.stringify(graph).includes("Secret"));
  assert.ok(!JSON.stringify(graph).includes("PRIVATE_BODY"));
  assert.ok(
    graph.articles.every(
      (item) => Object.keys(item).sort().join() === "category,id,title",
    ),
  );
});

test("topic aggregation is bounded and supports an empty or untagged community", () => {
  assert.deepEqual(buildTopicGraph([]).nodes, []);
  assert.equal(buildTopicGraph([article("a", [])]).articleCount, 1);
  const graph = buildTopicGraph(
    Array.from({ length: 160 }, (_, index) =>
      article(String(index), ["Common", `Topic ${index}`]),
    ),
  );
  assert.equal(graph.articleCount, 120);
  assert.equal(graph.nodes.length, 20);
  assert.ok(graph.links.length <= 80);
  assert.ok(
    graph.links.every(
      (link) =>
        graph.nodes.some((node) => node.id === link.source) &&
        graph.nodes.some((node) => node.id === link.target),
    ),
  );
});

test("public topics endpoint exposes a bounded graph without body or session data", async () => {
  const response = await fetch(base + "/api/topics", {
    headers: { Cookie: "devflow_session=invalid-test-cookie" },
  });
  assert.equal(response.status, 200);
  const graph = await response.json();
  assert.equal(graph.sampleLimit, 120);
  assert.ok(graph.articleCount > 0 && graph.articleCount <= 120);
  assert.ok(graph.nodes.length > 0 && graph.nodes.length <= 20);
  assert.ok(
    graph.articles.every(
      (item) =>
        !Object.hasOwn(item, "content") && !Object.hasOwn(item, "author_id"),
    ),
  );
  assert.ok(!Object.hasOwn(graph, "user") && !Object.hasOwn(graph, "profiles"));
  assert.equal(response.headers.get("set-cookie"), null);
  assert.ok(
    graph.nodes.every((node) =>
      node.articleIds.every((id) =>
        graph.articles.some((item) => item.id === id),
      ),
    ),
  );
  const home = await fetch(base).then((result) => result.text());
  assert.match(home, /data-universe="idle"/);
  assert.match(home, /data-topic-map/);
  assert.match(home, /href="#knowledge"/);
});
