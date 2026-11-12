import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const compiled=ts.transpileModule(readFileSync(new URL('../src/components/intent-link.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function fixture(connection){
  const pendingTimers=new Map();const changes=[];const cleanups=[];const imports=[];let nextTimer=0;
  const exports={};
  new Function('require','exports','navigator','setTimeout','clearTimeout',compiled)(name=>{
    if(name==='react')return {useRef:()=>({current:undefined}),useState:()=>[false,value=>changes.push(value)],useEffect:fn=>cleanups.push(fn())};
    if(name==='next/link')return {__esModule:true,default:'Link',useLinkStatus:()=>({pending:false})};
    if(name.endsWith('.css'))return {__esModule:true,default:{}};
    if(name==='./article-detail'||name==='./markdown'){imports.push(name);return {};}
    return require(name);
  },exports,{connection},(fn,delay)=>{const id=++nextTimer;pendingTimers.set(id,{fn,delay});return id},id=>pendingTimers.delete(id));
  const link=exports.IntentLink({href:'/article/example',children:'Read'});
  return {props:link.props,changes,pendingTimers,cleanups,imports};
}
test('intent links avoid viewport fanout, cancel fleeting hovers, and prefetch on focus',()=>{
  const state=fixture();
  assert.equal(state.props.prefetch,false);
  assert.deepEqual(state.changes,[]);
  state.props.onMouseEnter({});
  assert.equal([...state.pendingTimers.values()][0].delay,100);
  state.props.onMouseLeave({});
  assert.equal(state.pendingTimers.size,0);
  state.props.onMouseEnter({});
  [...state.pendingTimers.values()][0].fn();
  assert.deepEqual(state.changes,[true]);
  state.props.onFocus({});
  assert.equal(state.pendingTimers.size,0);
  state.cleanups.forEach(fn=>fn());
});
test('data-saver and 2g connections do not perform speculative navigation work',()=>{
  for(const connection of [{saveData:true},{effectiveType:'2g'},{effectiveType:'slow-2g'}]){
    const state=fixture(connection);
    state.props.onFocus({});state.props.onTouchStart({});
    assert.deepEqual(state.changes,[]);
  }
});
test('an immediate click starts required reader chunks without waiting for the route response',async()=>{
  const state=fixture();
  state.props.onClick({button:0,currentTarget:{target:''}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(new Set(state.imports),new Set(['./article-detail','./markdown']));
  assert.deepEqual(state.changes,[],'Actual navigation should not also schedule a speculative route request');
});
