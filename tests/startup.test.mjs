import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

test('production server fails before readiness when backend configuration is unsafe', async () => {
  for (const overrides of [
    {DATA_BACKEND:'supabase',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:''},
    {DATA_BACKEND:'local',NETLIFY:'true'},
  ]) {
    const server = spawn(process.execPath,['scripts/start.mjs','--hostname','127.0.0.1','-p','0'], {
      env:{...process.env,...overrides},stdio:['ignore','pipe','pipe'],windowsHide:true,
    });
    let output='';
    server.stdout.on('data',chunk => {output+=chunk;});
    server.stderr.on('data',chunk => {output+=chunk;});
    const timeout=setTimeout(()=>server.kill(),15000);
    const code = await new Promise(resolveExit => server.on('exit',resolveExit));
    clearTimeout(timeout);
    assert.notEqual(code,0);
    assert.doesNotMatch(output,/✓ Ready/);
    if (overrides.DATA_BACKEND === 'supabase') assert.match(output,/missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    else assert.match(output,/not supported in serverless/);
  }
});
