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
function element() {
  const classes = new Set(), attrs = new Map(), children = [];
  return { ...events(), children, classes, attrs, dataset:{}, isConnected:true, parent:null,
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,on){on?classes.add(k):classes.delete(k);}},
    style:{setProperty(){},removeProperty(){}},
    setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),
    append(el){ if(el.parent) el.parent.children.splice(el.parent.children.indexOf(el),1); children.push(el); el.parent=this; },
    remove(){ if(this.parent) this.parent.children.splice(this.parent.children.indexOf(this),1); },
    querySelector(){return null;}, querySelectorAll(){return [];}
  };
}
function run(file,globals) {
  const output=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context={exports:{},...globals}; runInNewContext(output,context); return context.exports;
}
function fixture({desktop=true,reduced=false}={}) {
  const root=element(), articles=Array.from({length:4},()=>element()), columns=articles.map(()=>element());
  const figures=columns.map(()=>element());
  let y=0; const frames=new Map(); let next=0;
  const media=[{...events(),matches:desktop},{...events(),matches:reduced}];
  const window=events(), document={...events(),visibilityState:'visible',querySelector:()=>root,createElement:element};
  articles.forEach((a,i)=>{ a.append(columns[i]); a.querySelector=()=>columns[i]; a.getBoundingClientRect=()=>({top:i*1000-y,bottom:(i+1)*1000-y,height:1000}); columns[i].querySelector=()=>figures[i]; figures[i].getBoundingClientRect=a.getBoundingClientRect; });
  root.querySelectorAll=()=>articles;
  let observer,disconnected=0;
  const api=run('src/lib/service-story.ts',{document,window,innerHeight:900,
    matchMedia:q=>q.includes('reduced')?media[1]:media[0],
    requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),
    IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){disconnected++;}},
    ResizeObserver:class{observe(){}disconnect(){disconnected++;}}
  });
  const cleanup=api.initServiceStory();
  function flush(){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn());}
  observer([{isIntersecting:true}]);flush();
  return {root,articles,columns,figures,media,frames,window,document,cleanup,
    scroll(n){y=n;window.emit('scroll');flush();},
    visible(v){observer([{isIntersecting:v}]);flush();},
    change(i,value){media[i].matches=value;media[i].emit('change');flush();},
    get disconnected(){return disconnected;}
  };
}
test('story follows scroll down and back, including direct jumps to the fourth service',()=>{
  const f=fixture();
  f.scroll(400); assert.equal(f.figures[0].dataset.step,'2');
  f.scroll(0); assert.equal(f.figures[0].dataset.step,'1');
  f.scroll(2800); assert.equal(f.columns[3].attrs.get('aria-hidden'),'false');
  assert.equal(f.columns[0].attrs.get('aria-hidden'),'true');
  f.scroll(0); assert.equal(f.columns[0].attrs.get('aria-hidden'),'false');
  f.cleanup();
});
test('resize restores each illustration to its own article without duplicating DOM',()=>{
  const f=fixture();
  f.change(0,false);
  f.columns.forEach((c,i)=>assert.equal(c.parent,f.articles[i]));
  f.change(0,true); assert.equal(f.root.children[0].children.length,4);
  f.change(0,false); f.columns.forEach((c,i)=>assert.equal(f.articles[i].children.filter(x=>x===c).length,1));
  f.cleanup();
});
test('reduced motion restores static content at startup and when changed live',()=>{
  for(const initial of [true,false]) {
    const f=fixture({reduced:initial}); if(!initial)f.change(1,true);
    assert.equal(f.root.classes.has('is-connected'),false);
    f.columns.forEach((c,i)=>{assert.equal(c.parent,f.articles[i]);assert.equal(c.attrs.has('aria-hidden'),false);assert.equal(f.figures[i].classes.has('sv-animated'),false);});
    f.cleanup();
  }
});
test('story schedules no frames outside viewport or hidden, and removes all listeners',()=>{
  const f=fixture(); f.visible(false); f.scroll(400);assert.equal(f.frames.size,0);
  f.document.visibilityState='hidden'; f.visible(true); f.scroll(800);assert.equal(f.frames.size,0);
  f.cleanup(); assert.equal(f.disconnected,2); assert.equal(f.root.children.length,0);
  for(const target of [f.window,f.document,...f.media]) for(const group of target.listeners.values()) assert.equal(group.size,0);
});

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
