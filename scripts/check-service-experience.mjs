import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const events = () => {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(k,fn) { if(!listeners.has(k)) listeners.set(k,new Set()); listeners.get(k).add(fn); },
    removeEventListener(k,fn) { listeners.get(k)?.delete(fn); },
    emit(k) { for(const fn of listeners.get(k)??[]) fn(); }
  };
};
function run(file,globals) {
  const output=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context={exports:{},...globals}; runInNewContext(output,context); return context.exports;
}
test('hash navigation cancels inertia, applies one header offset and cleans up',()=>{
  const frames=new Map(),calls=[];let next=0;
  const window={...events(),scrollY:1000,matchMedia:()=>({matches:false})};
  const target={getBoundingClientRect:()=>({top:192})};
  const document={getElementById:()=>target,querySelector:()=>target};
  const api=run('src/lib/lenis.ts',{window,document,location:{hash:'#service-webapp'},
    requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),
    require:()=>class {raf(){}destroy(){}scrollTo(top,options){calls.push({top,options});}}
  });
  api.initLenis();
  const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(0));
  assert.equal(calls[0].top,1192);assert.equal(calls[0].options.offset,-96);assert.equal(calls[0].options.immediate,true);
  api.scrollToTarget(2000,{offset:0});assert.equal(calls[1].top,2000);assert.equal(calls[1].options.offset,0);
  api.destroyLenis();assert.equal(frames.size,0);assert.equal(window.listeners.get('hashchange').size,0);
});
