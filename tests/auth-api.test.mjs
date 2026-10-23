import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

// Execute the real route with a fake Auth provider. No real users/emails are created.
const require = createRequire(import.meta.url);
function routeFixture(result) {
  const sessions = [], inputs = [], logs = [];
  let profileWrites = 0;
  const auth = Object.fromEntries(['signUp','signInWithPassword'].map(method => [method, async input => {
    inputs.push(input);
    return result;
  }]));
  const modules = {
    '@/lib/auth': {
      context: async () => ({user:null,store:{}}),
      setSession: async (...tokens) => sessions.push(tokens),
    },
    '@/lib/store': {isCloud:true,cloudClient:()=>({auth}),Store:class {
      async list() { return [{id:'fake-user'}]; }
      async insert() { profileWrites++; }
    }},
    '@/lib/community': {},
    '@/lib/public-data': {invalidatePublicCommunity() {}},
    '@/lib/rate-limit': {takeAuthAttempt:async()=>true},
  };
  const load = (path) => {
    const exports = {};
    const {outputText} = ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
    new Function('require','exports','console',outputText)(name => {
      if (name in modules) return modules[name];
      if (name === '@/lib/auth-errors') return load('src/lib/auth-errors.ts');
      return require(name);
    }, exports, {warn:(...args)=>logs.push(args),error:(...args)=>logs.push(args)});
    return exports;
  };
  const route = load('src/app/api/community/route.ts');
  async function post(body, origin) {
    const response = await route.POST(new Request('http://localhost/api/community',{
      method:'POST',headers:{host:'localhost','Content-Type':'application/json',...(origin ? {origin} : {})},
      body:JSON.stringify(body),
    }));
    return {status:response.status,body:await response.json()};
  }
  return {post,sessions,inputs,logs,get profileWrites(){return profileWrites;}};
}
const input = {action:'register',email:'  Test@Example.test ',password:'safe-testing-password',name:'测试用户'};

test('cloud registration preserves SMTP/rate-limit diagnostics without leaking provider details or creating cookies', async () => {
  for (const [code,status,expected,pattern] of [
    ['over_email_send_rate_limit',429,429,/验证邮件发送额度/],
    ['email_address_not_authorized',403,503,/配置邮件服务/],
    ['over_request_rate_limit',429,429,/过于频繁/],
    ['signup_disabled',422,503,/暂未开放注册/],
    ['unexpected_failure',500,503,/认证服务暂时不可用/],
    ['weak_password',422,400,/密码强度/],
    ['user_already_exists',422,400,/申请无法完成/],
  ]) {
    const fixture=routeFixture({data:{user:null,session:null},error:{code,status,message:'private@example.test SECRET_TOKEN raw-provider-message'}});
    const result=await fixture.post(input);
    assert.equal(result.status,expected,code);
    assert.match(result.body.error,pattern);
    assert.doesNotMatch(JSON.stringify([result,fixture.logs]),/SECRET_TOKEN|private@|raw-provider|已注册|already_exists/);
    assert.deepEqual(fixture.sessions,[]);
    assert.equal(fixture.profileWrites,0);
  }
});
test('cloud signup supports both confirmation-required and immediate-session settings', async () => {
  const confirmation=routeFixture({data:{user:{id:'fake-user'},session:null},error:null});
  const result=await confirmation.post(input);
  assert.equal(result.status,200);
  assert.equal(result.body.confirmation,true);
  assert.equal(confirmation.inputs[0].email,'test@example.test');
  assert.deepEqual(confirmation.sessions,[]);
  const immediate=routeFixture({data:{user:{id:'fake-user'},session:{access_token:'fake-access',refresh_token:'fake-refresh'}},error:null});
  assert.deepEqual(await immediate.post(input),{status:200,body:{success:true}});
  assert.deepEqual(immediate.sessions,[['fake-access','fake-refresh']]);
  assert.equal(immediate.profileWrites,0,'Existing trigger-created profile must be reused');
});
test('cloud login uses 401; invalid origins/input use Chinese 4xx and anonymous views report not counted', async () => {
  const fixture=routeFixture({data:{},error:{code:'invalid_credentials',status:400,message:'private'}});
  assert.equal((await fixture.post({...input,action:'login'})).status,401);
  for (const origin of ['null','broken://','https://untrusted.example','file://localhost'])
    assert.equal((await fixture.post(input,origin)).status,403,origin);
  for (const body of [{},{action:'view',id:'bad'},null]) {
    const result=await fixture.post(body);
    assert.equal(result.status,400);
    assert.match(result.body.error,/[\u3400-\u9fff]/);
  }
  assert.deepEqual((await fixture.post({action:'view',id:'10000000-0000-4000-8000-000000000001'})).body,
    {success:true,counted:false,reason:'anonymous'});
});
