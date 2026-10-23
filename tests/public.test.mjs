import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('anonymous list and detail projections, SEO and exact 404 status', async () => {
  const response = await fetch(base + '/api/community');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.user, null);
  assert.ok(data.articles.length > 0);
  assert.ok(data.articles.every(article => !Object.hasOwn(article, 'content')));
  assert.equal(data.article, null);
  const first = data.articles[0];
  const detail = await fetch(base + '/api/community?article=' + first.id).then(r => r.json());
  assert.equal(detail.article.id, first.id);
  assert.ok(detail.article.content.length >= 20);
  assert.ok(detail.articles.every(article => !Object.hasOwn(article, 'content')));
  const home = await fetch(base).then(r => r.text());
  assert.ok(!home.includes(JSON.stringify(detail.article.content).slice(1,-1)), 'Home RSC must not serialize article bodies');
  assert.match(home, /id="devflow-theme"/);
  assert.ok(home.indexOf('id="devflow-theme"') < home.indexOf('</head>'));
  const theme = /<script id="devflow-theme">([\s\S]*?)<\/script>/.exec(home)?.[1];
  assert.ok(theme);
  for (const stored of ['dark',null]) {
    const document = {documentElement:{dataset:{},style:{}}};
    runInNewContext(theme,{document,localStorage:{getItem:()=>stored},matchMedia:()=>({matches:true})});
    assert.equal(document.documentElement.dataset.theme,'dark');
    assert.equal(document.documentElement.style.colorScheme,'dark');
  }
  const articleResponse = await fetch(base + '/article/' + first.id);
  assert.equal(articleResponse.status, 200);
  const html = await articleResponse.text();
  assert.match(html, /property="og:title"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  const other = await fetch(base + '/api/community?article=' + data.articles[1].id).then(r => r.json());
  assert.ok(!html.includes(JSON.stringify(other.article.content).slice(1,-1)), 'Article HTML must not contain other article bodies');
  for (const path of ['/unknown-page','/category/invalid','/article/invalid','/article/00000000-0000-4000-8000-000000000000','/user/00000000-0000-4000-8000-000000000000']) {
    assert.equal((await fetch(base + path)).status, 404, path);
    assert.equal((await fetch(base + path, {method:'HEAD'})).status, 404, 'HEAD ' + path);
  }
  const sitemapResponse = await fetch(base + '/sitemap.xml');
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.ok(sitemap.includes('/article/' + first.id));
  assert.ok(sitemap.includes('/category/ai'));
  const robots = await fetch(base + '/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https?:\/\/.+\/sitemap\.xml/);
  const image = await fetch(base + '/opengraph-image');
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/png/);
});
