import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const email = `devflow-test-${Date.now()}@example.test`;
let cookie = "",
  secondCookie = "",
  ownId,
  commentId;
async function call(action, payload = {}, session = cookie, origin) {
  const response = await fetch(`${base}/api/community`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: session,
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json();
  return { response, result };
}
async function state(session = cookie) {
  const response = await fetch(`${base}/api/community`, {
    headers: { Cookie: session },
  });
  assert.equal(response.status, 200);
  return response.json();
}
const article = {
  title: "集成测试：一个真实发布的技术分享",
  content:
    '## 这是一个真实的测试内容\n\n验证发布、权限控制和数据持久化，而不是只验证界面状态。\n\n```js\nconsole.log("DevFlow");\n```',
  excerpt: "用于验证实际数据库写入的集成测试文章。",
  category: "frontend",
  tags: ["测试"],
  cover: "react",
  status: "published",
};
test("local community lifecycle, persistence and authorization", async (t) => {
  const initial = await state("");
  if (initial.mode === "supabase") {
    t.skip("Supabase lifecycle is not mutated by automated smoke tests. Full lifecycle: npm run test:local");
    return;
  }
  assert.equal(
    initial.mode,
    "local",
    "Run this suite against local SQLite only.",
  );
  assert.ok(initial.articles.length >= 18);
  assert.equal(initial.user, null);
  assert.ok(initial.profiles.every((p) => !p.email && !p.password_hash));
  const sample = initial.articles[0];
  await t.test(
    "anonymous writes and foreign origins are rejected",
    async () => {
      assert.equal(
        (await call("like", { id: sample.id }, "")).response.status,
        401,
      );
      assert.equal(
        (
          await call(
            "login",
            { email, password: "testing-password" },
            "",
            "https://untrusted.example",
          )
        ).response.status,
        403,
      );
      for (const origin of ['null','invalid-origin','file://localhost'])
        assert.equal((await call('login',{email,password:'testing-password'},'',origin)).response.status,403);
    },
  );
  await t.test(
    "register and cookie session persist across requests",
    async () => {
      const { response } = await call(
        "register",
        { email, password: "testing-password", name: "集成测试用户" },
        "",
      );
      assert.equal(response.status, 200);
      const setCookie = response.headers.get("set-cookie");
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=lax/i);
      cookie = setCookie.split(";")[0];
      assert.equal((await state()).user.name, "集成测试用户");
      assert.equal(
        (await call("login", { email, password: "wrong-password" }, ""))
          .response.status,
        401,
      );
      const duplicate = await call(
        "register",
        { email, password: "testing-password", name: "重复注册" },
        "",
      );
      assert.equal(duplicate.response.status, 400);
      assert.doesNotMatch(duplicate.result.error, /已注册|已经注册/);
    },
  );
  await t.test("short drafts save and remain private", async () => {
    const { result, response } = await call("saveArticle", {
      article: { ...article, title: "草稿", content: "", status: "draft" },
    });
    assert.equal(response.status, 200);
    ownId = result.id;
    assert.ok((await state()).articles.some((a) => a.id === ownId));
    assert.ok(!(await state("")).articles.some((a) => a.id === ownId));
    const privateDetail = await fetch(`${base}/api/community?article=${ownId}`).then(r => r.json());
    assert.equal(privateDetail.article, null);
    assert.equal((await fetch(`${base}/article/${ownId}`)).status, 404);
    assert.equal(
      (
        await call("saveArticle", {
          article: {
            ...article,
            title: "短",
            content: "少",
            status: "published",
          },
        })
      ).response.status,
      400,
    );
  });
  await t.test("anonymous views do not count and signed-in daily views deduplicate", async () => {
    const before = (await state("")).articles.find(a => a.id === sample.id).views;
    const anonymous = await call("view",{id:sample.id},"");
    assert.equal(anonymous.response.status,200);
    assert.equal(anonymous.result.counted,false);
    assert.equal((await state("")).articles.find(a => a.id === sample.id).views,before);
    assert.equal((await call("view",{id:sample.id})).response.status,200);
    assert.equal((await call("view",{id:sample.id})).response.status,200);
    assert.equal((await state("")).articles.find(a => a.id === sample.id).views,before+1);
  });
  await t.test(
    "publish a saved draft and re-query stored content",
    async () => {
      assert.equal(
        (await call("saveArticle", { article: { ...article, id: ownId } }))
          .response.status,
        200,
      );
      const detailResponse = await fetch(`${base}/api/community?article=${ownId}`);
      assert.equal(detailResponse.status, 200);
      const stored = (await detailResponse.json()).article;
      assert.equal(stored.title, article.title);
      assert.equal(stored.content, article.content);
    },
  );
  await t.test("like, bookmark, follow and comment persist", async () => {
    for (const action of ["like", "bookmark"])
      assert.equal((await call(action, { id: ownId })).response.status, 200);
    assert.equal(
      (await call("follow", { id: sample.author_id })).response.status,
      200,
    );
    assert.equal(
      (
        await call("comment", {
          id: ownId,
          content: "这是一条保存在数据库中的测试评论。",
        })
      ).response.status,
      200,
    );
    const next = await state();
    assert.equal(next.likes.filter((l) => l.article_id === ownId).length, 1);
    assert.equal(
      next.bookmarks.filter((l) => l.article_id === ownId).length,
      1,
    );
    assert.ok(
      next.follows.some(
        (f) => f.author_id === sample.author_id && f.user_id === next.user.id,
      ),
    );
    commentId = next.comments.find((c) => c.article_id === ownId).id;
    assert.ok(!(await state("")).bookmarks.length);
  });
  await t.test(
    "another user cannot edit/delete articles or comments",
    async () => {
      const { response } = await call(
        "register",
        {
          email: `second-${email}`,
          password: "testing-password",
          name: "权限测试用户",
        },
        "",
      );
      secondCookie = response.headers.get("set-cookie").split(";")[0];
      assert.equal(
        (
          await call(
            "saveArticle",
            { article: { ...article, id: ownId } },
            secondCookie,
          )
        ).response.status,
        403,
      );
      assert.equal(
        (await call("deleteArticle", { id: ownId }, secondCookie)).response
          .status,
        403,
      );
      assert.equal(
        (await call("deleteComment", { id: commentId }, secondCookie)).response
          .status,
        403,
      );
      assert.equal(
        (await call("saveArticle", { article: { ...article, id: sample.id } }))
          .response.status,
        403,
      );
    },
  );
  await t.test("reactions can be removed, and deletes cascade", async () => {
    assert.equal((await call("like", { id: ownId })).response.status, 200);
    assert.equal(
      (await state()).likes.filter((l) => l.article_id === ownId).length,
      0,
    );
    assert.equal(
      (await call("deleteComment", { id: commentId })).response.status,
      200,
    );
    assert.ok(!(await state()).comments.some((c) => c.id === commentId));
    assert.equal(
      (await call("deleteArticle", { id: ownId })).response.status,
      200,
    );
    const next = await state();
    assert.ok(!next.articles.some((a) => a.id === ownId));
    assert.ok(!next.bookmarks.some((b) => b.article_id === ownId));
    await call("follow", { id: sample.author_id });
  });
  await t.test(
    "logout revokes existing server sessions; login works again",
    async () => {
      assert.equal((await call("logout")).response.status, 200);
      assert.equal((await state()).user, null);
      assert.equal(
        (await call("like", { id: sample.id })).response.status,
        401,
      );
      const { response } = await call(
        "login",
        { email, password: "testing-password" },
        "",
      );
      assert.equal(response.status, 200);
      cookie = response.headers.get("set-cookie").split(";")[0];
      assert.equal((await state()).user.name, "集成测试用户");
      await call("logout");
      await call("logout", {}, secondCookie);
    },
  );
  await t.test(
    "all public routes serve and unknown paths return 404",
    async () => {
      for (const path of [
        "/",
        "/discover",
        "/trending",
        "/search?q=React",
        "/category/ai",
        `/article/${sample.id}`,
        `/user/${sample.author_id}`,
        "/write",
        "/login",
        "/register",
        "/bookmarks",
        "/dashboard",
        "/about",
        "/guidelines",
      ]) {
        const response = await fetch(base + path);
        assert.equal(response.status, 200, path);
        const html = await response.text();
        assert.ok(
          !html.includes("Only plain objects"),
          "Server component serialization failed",
        );
      }
      for (const path of ["/unknown-page", "/category/invalid"]) {
        const missing = await fetch(base + path);
        const html = await missing.text();
        assert.equal(missing.status, 404);
        assert.match(html, /灵感还在，页面走丢了/);
        assert.match(html, /name="robots" content="noindex"/);
      }
    },
  );
  await t.test("authentication attempts persist in a shared SQLite window", async () => {
    const limitedEmail = `limit-${email}`;
    for (let attempt=0; attempt<13; attempt++) {
      const result = await call("login", {email:limitedEmail,password:"wrong-password"}, "");
      assert.equal(result.response.status, attempt<12 ? 401 : 429);
    }
  });
});
