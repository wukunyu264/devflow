import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { backendConfig } from '../src/lib/backend.ts';

nextEnv.loadEnvConfig(process.cwd(), true, {info() {}, error() {}});
const local = process.argv.includes('--local') || backendConfig().backend === 'local';
const testEnv = {...process.env};
let server;
let output = '';
if (local) {
  const reservation = createServer();
  await new Promise(resolveReady => reservation.listen(0, '127.0.0.1', resolveReady));
  const port = reservation.address().port;
  await new Promise(resolveClosed => reservation.close(resolveClosed));
  Object.assign(testEnv, {DATA_BACKEND:'local', NEXT_PUBLIC_SUPABASE_URL:'', NEXT_PUBLIC_SUPABASE_ANON_KEY:'',
    LOCAL_DATA_DIR:resolve('test-results', `sqlite-${randomUUID()}`), DATA_TRACE:'1',
    TEST_BASE_URL:`http://127.0.0.1:${port}`});
  // Tests use a dedicated persistent SQLite file, never the developer's data directory.
  server = spawn(process.execPath, ['scripts/start.mjs','--hostname','127.0.0.1','-p',String(port)], {
    env:testEnv, stdio:['ignore','pipe','pipe'], windowsHide:true,
  });
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  let ready = false;
  for (let attempt=0; attempt<60; attempt++) {
    if (server.exitCode !== null) break;
    try { const response = await fetch(testEnv.TEST_BASE_URL + '/api/community'); if (response.ok) { ready=true; break; } } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  if (!ready) { server.kill(); console.error('Local production server did not become ready. Run npm run build first.\n' + output); process.exit(1); }
  console.log(`LOCAL: isolated SQLite; cloud variables cleared; ${testEnv.TEST_BASE_URL}`);
} else {
  testEnv.TEST_BASE_URL ||= process.env.SITE_URL || 'https://boisterous-cascaron-44d48a.netlify.app';
  console.log(`SUPABASE: read-only acceptance against ${testEnv.TEST_BASE_URL}; write lifecycle skipped. Run npm run test:local for the full local lifecycle.`);
}
try {
  if (local) {
    const snapshot = await fetch(testEnv.TEST_BASE_URL + '/api/community').then(response => response.json());
    const traceStart = output.length;
    const detail = await fetch(testEnv.TEST_BASE_URL + '/article/' + snapshot.articles[0].id);
    assert.equal(detail.status,200);
    await detail.text();
    await new Promise(resolveFlush => setImmediate(resolveFlush));
    const trace = output.slice(traceStart);
    const snapshots = (trace.match(/\[DevFlow data\] community snapshot/g) || []).length;
    const queries = (trace.match(/\[DevFlow query\]/g) || []).length;
    assert.equal(snapshots,1,'metadata + Page must share one community snapshot');
    assert.equal((trace.match(/\[DevFlow query\] articles\b/g) || []).length,1,'only the current article body may be queried');
    await mkdir('test-results',{recursive:true});
    await writeFile('test-results/data-reads.json',JSON.stringify({snapshots,queries,bodyQueries:1},null,2));
    console.log(`Article SSR: ${snapshots} snapshot, ${queries} bounded queries, one article body.`);
    const portalTraceStart = output.length;
    const portal = await fetch(testEnv.TEST_BASE_URL).then(response => response.text());
    await new Promise(resolveFlush => setImmediate(resolveFlush));
    assert.match(portal, /data-landing-root/);
    assert.equal((output.slice(portalTraceStart).match(/\[DevFlow query\]/g) || []).length,0,'Portal must not query community data');
    console.log('Portal SSR: no community database queries; full feed remains at /community.');
    const measurement = spawn(process.execPath,['scripts/measure-first-load.mjs','after-http'],{env:testEnv,stdio:'inherit',windowsHide:true});
    const measured = await new Promise(resolveExit => measurement.on('exit',code => resolveExit(code ?? 1)));
    assert.equal(measured,0,'Production first-load measurement failed');
  }
  const testFiles = ['tests/backend.test.mjs','tests/database.test.mjs','tests/public.test.mjs','tests/community.test.mjs','tests/article-rendering.test.mjs'];
  if (local) testFiles.push('tests/startup.test.mjs');
  const child = spawn(process.execPath, ['--test',...testFiles], {
    env:testEnv, stdio:'inherit', windowsHide:true,
  });
  process.exitCode = await new Promise(resolveExit => child.on('exit', code => resolveExit(code ?? 1)));
} finally {
  server?.kill();
  if (server) {
    await mkdir('test-results', {recursive:true});
    await writeFile('test-results/local-server.log', output);
  }
}
