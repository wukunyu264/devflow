import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

// Measure only unique JS/CSS resources referenced by the complete production HTML.
// Excludes HTML/RSC, maps, fonts, images and chunks loaded only after interaction.
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3187';
let resources;
const manifestMode = process.argv.includes('--manifest');
if (manifestMode) {
  const scope = {};
  runInNewContext(await readFile('.next/server/app/[[...path]]/page_client-reference-manifest.js','utf8'), scope);
  const manifest = scope.__RSC_MANIFEST['/[[...path]]/page'];
  const build = JSON.parse(await readFile('.next/build-manifest.json','utf8'));
  resources = [...new Set([...build.rootMainFiles, ...build.polyfillFiles,
    ...Object.values(manifest.clientModules).flatMap(entry => entry.chunks).filter(path => path.endsWith('.js')),
    ...Object.values(manifest.entryCSSFiles).flat().map(entry => entry.path)])].map(path => '/_next/' + path);
} else {
  const response = await fetch(base);
  if (!response.ok) throw new Error(`Homepage HTTP ${response.status}`);
  const html = await response.text();
  await mkdir('test-results',{recursive:true});
  await writeFile(`test-results/${process.argv[2] || 'first-load'}-head.html`,html.slice(0,html.indexOf('</head>')+7));
  resources = [...new Set([...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))(?:\?[^\"]*)?"/g)]
    .map(match => match[1]).filter(path => path.startsWith('/_next/static/')))];
}
if (!resources.length) throw new Error('No production JS/CSS resources found');
const files = await Promise.all(resources.map(async url => {
  const bytes = await readFile(resolve('.next', decodeURIComponent(url.slice('/_next/'.length))));
  return { url, bytes: bytes.length, gzip: gzipSync(bytes).length };
}));
const result = { measuredAt: new Date().toISOString(), method: manifestMode ? 'client reference manifest entry chunks + root + polyfill + CSS; gzip per resource' : 'unique JS/CSS src/href in production homepage HTML; gzip per resource',
  bytes: files.reduce((n, file) => n + file.bytes, 0), gzip: files.reduce((n, file) => n + file.gzip, 0), files };
await mkdir('test-results', {recursive:true});
await writeFile(`test-results/${process.argv[2] || 'first-load'}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (process.argv[2]?.startsWith('after') && (result.bytes >= 800000 || result.gzip >= 260000)) {
  throw new Error('First-load budget exceeded: require raw <800000 and gzip <260000 bytes.');
}
