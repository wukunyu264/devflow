import {mkdir,writeFile} from 'node:fs/promises';

// Small anonymous sample; no logins, writes, cookies or authentication load tests.
const base=process.env.TEST_BASE_URL || 'https://boisterous-cascaron-44d48a.netlify.app';
const label=process.argv[2] === 'before' ? 'before' : 'after';
const community=await fetch(base+'/api/community').then(r=>{
  if (!r.ok) throw new Error(`Community HTTP ${r.status}`);
  return r.json();
});
async function sample(path) {
  const start=performance.now();
  const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});
  const ttfbMs=Math.round(performance.now()-start);
  await response.arrayBuffer();
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
  return ttfbMs;
}
function stats(values) {
  const sorted=values.toSorted((a,b)=>a-b);
  return {samples:values.length,p50:sorted[Math.ceil(sorted.length*.5)-1],p95:sorted[Math.ceil(sorted.length*.95)-1],min:sorted[0],max:sorted.at(-1)};
}
const sequential={};
for (const path of ['/community','/discover','/article/'+community.articles[0].id,'/api/community']) {
  // Prime this exact cache key, then take five warm samples.
  await sample(path);
  const values=[];
  for (let i=0;i<5;i++) values.push(await sample(path));
  sequential[path]=stats(values);
}
const concurrent20=stats(await Promise.all(Array.from({length:20},()=>sample('/api/community'))));
const result={measuredAt:new Date().toISOString(),method:'anonymous Node fetch; headers TTFB in ms; 5 warm samples per path and one warm 20-request API burst; not browser LCP',sequential,concurrent20};
await mkdir('test-results',{recursive:true});
await writeFile(`test-results/public-perf-${label}.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
