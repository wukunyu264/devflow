import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const compiled=ts.transpileModule(readFileSync(new URL('../src/lib/auth.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture({token='session',status='active',expired=false,delayed=false}={}){
  const calls=[],writes=[];
  let release;
  const gate=delayed?new Promise(resolve=>{release=resolve}):Promise.resolve();
  const require=createRequire(import.meta.url);
  const jar={get:name=>name==='df_session'&&token?{value:token}:name==='df_refresh'&&expired?{value:'refresh'}:undefined,set:(...args)=>writes.push(args)};
  class Store {
    constructor(value){this.token=value;}
    async list(){calls.push('profile');return [{id:'user-1',name:'Example'}];}
  }
  const cloudClient=value=>({
    auth:{
      async getUser(){calls.push('identity');await gate;return expired?{data:{user:null},error:{status:401}}:{data:{user:{id:'user-1'}},error:null};},
      async refreshSession(){return {data:{session:{access_token:'new-session',refresh_token:'new-refresh'},user:{id:'user-1'}}};},
    },
    async rpc(){calls.push('session:'+value);if(expired&&value==='session')return {data:null,error:{status:401}};return {data:status==='active',error:status==='unavailable'?{message:'Database unavailable'}:null};},
  });
  const exported={};
  new Function('require','exports',compiled)(name=>name==='next/headers'?{cookies:async()=>jar}:name==='./store'?{cloudClient,isCloud:true,Store}:require(name),exported);
  return {context:exported.context,calls,writes,release};
}
test('cloud identity and revocation checks start concurrently; both must succeed',async()=>{
  const state=fixture({delayed:true});
  const pending=state.context(false);
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(state.calls.includes('identity'));
  assert.ok(state.calls.includes('session:session'),'Revocation check must not wait for the identity round trip');
  assert.ok(!state.calls.includes('profile'),'Do not expose a profile before identity verification');
  state.release();
  assert.equal((await pending).user.id,'user-1');
});
test('parallel session checks still reject revoked or unavailable sessions',async()=>{
  const revoked=fixture({status:'revoked'});
  assert.equal((await revoked.context(false)).user,null);
  assert.ok(!revoked.calls.includes('profile'));
  const unavailable=fixture({status:'unavailable'});
  await assert.rejects(unavailable.context(false),/Session validation unavailable/);
  assert.ok(!unavailable.calls.includes('profile'));
  const anonymous=fixture({token:null});
  assert.equal((await anonymous.context(false)).user,null);
  assert.deepEqual(anonymous.calls,[]);
});
test('refreshed access tokens receive a fresh revocation check',async()=>{
  const state=fixture({expired:true});
  const result=await state.context();
  assert.equal(result.user.id,'user-1');
  assert.equal(result.store.token,'new-session');
  assert.ok(state.calls.includes('session:session')&&state.calls.includes('session:new-session'));
  assert.equal(state.writes.length,2);
});
