// Run with: node scripts/check-mobile-motion.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('src/lib/interactions.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
for (const [touch, reduced, tall] of [[true, false, true], [true, false, false], [true, true, true], [false, false, true]]) {
  const effects = [];
  let stopped = 0;
  let disconnected = 0;
  const element = () => ({ style: { setProperty() {}, removeProperty() {} }, offsetHeight: 700, parentElement: {} });
  const projects = [element(), element()];
  const services = [element(), element(), element(), element()];
  const exports = {};
  runInNewContext(source, {
    exports,
    require: () => ({
      animate: (target, frames) => ({ target, frames }),
      scroll: (animation, options) => { effects.push({ ...animation, options }); return () => stopped++; }
    }),
    document: { querySelectorAll: (selector) => selector === '.stack-item' ? projects : selector === '.offering' ? services : [] },
    window: { matchMedia: (query) => ({
      matches: query.includes('reduced-motion') ? reduced : query.includes('min-height') ? tall : query.includes('pointer: coarse') ? touch : !touch,
      addEventListener() {}, removeEventListener() {}
    }) },
    ResizeObserver: class { observe() {} disconnect() { disconnected++; } }
  });
  exports.initInteractions();
  assert.equal(effects.filter(({target}) => projects.includes(target)).length, !reduced && tall ? 1 : 0);
  assert.equal(effects.filter(({target}) => services.includes(target)).length, !reduced && touch ? 4 : 0);
  for (const effect of effects.filter(({target}) => services.includes(target))) {
    assert.deepEqual(Array.from(effect.frames['--mobile-glow']), [0, 1, 0]);
    assert.equal(effect.options.target, effect.target.parentElement);
  }
  exports.destroyInteractions();
  assert.equal(stopped, effects.length);
  assert.equal(disconnected, reduced ? 0 : 1);
}
console.log('Mobile motion: portrait, landscape, desktop, reduced motion and cleanup passed.');
