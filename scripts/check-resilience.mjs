// Test production source with controlled browser failures; no network or GPU needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function execute(source, globals, expose = '') {
  const output = ts.transpileModule(`${source}\n${expose}`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const context = { exports: {}, Event, CustomEvent, ...globals };
  runInNewContext(output, context);
  return context.qa ?? context.exports;
}
const source = (file) => readFileSync(file, 'utf8');
const astroScript = (file) => source(file).match(/<script>([\s\S]*?)<\/script>/)[1];

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    dispatchEvent(event) { for (const callback of [...(listeners.get(event.type) ?? [])]) callback(event); },
    listeners
  };
}
function environment() {
  let nextId = 0;
  const frames = new Map();
  const timers = new Map();
  const idle = new Map();
  const window = { ...eventTarget(), scrollY: 0,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    setTimeout: (fn) => { const id = ++nextId; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    requestIdleCallback: (fn) => { const id = ++nextId; idle.set(id, fn); return id; },
    cancelIdleCallback: (id) => idle.delete(id)
  };
  const document = { ...eventTarget(), readyState: 'complete', visibilityState: 'visible', activeElement: null };
  function element() {
    const classes = new Set();
    const attrs = new Map();
    return {
      ...eventTarget(), attrs, classes, dataset: {}, hidden: false, inert: false, isConnected: true,
      style: { setProperty() {}, removeProperty() {} },
      classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name), toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); } },
      setAttribute: (name, value) => attrs.set(name, String(value)),
      getAttribute: name => attrs.get(name) ?? null,
      removeAttribute: name => attrs.delete(name),
      hasAttribute: name => attrs.has(name),
      focus() { document.activeElement = this; },
      contains(child) { return child === this; },
      querySelector: () => null, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ top: 0, bottom: 700, height: 700, left: 10, width: 30 })
    };
  }
  document.documentElement = element();
  const meta = element();
  document.querySelector = selector => selector.includes('theme-color') ? meta : null;
  const raf = fn => { const id = ++nextId; frames.set(id, fn); return id; };
  const cancelRaf = id => frames.delete(id);
  const flush = queue => { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach(fn => fn()); };
  return { window, document, element, meta, frames, timers, idle, flush, requestAnimationFrame: raf, cancelAnimationFrame: cancelRaf };
}

function themeFixture(storageFails = false) {
  const env = environment();
  const saved = new Map();
  const localStorage = { setItem(key, value) { if (storageFails) throw new Error('SecurityError: storage blocked'); saved.set(key, value); } };
  return { ...env, saved, theme: execute(source('src/lib/theme.ts'), { ...env, localStorage }) };
}

test('blocked storage cannot interrupt theme, metadata or other controls', () => {
  const fixture = themeFixture(true);
  let events = 0;
  fixture.window.addEventListener('theme-change', () => events++);
  assert.doesNotThrow(() => fixture.theme.applyTheme('dark'));
  assert.equal(fixture.document.documentElement.classList.contains('dark'), true);
  assert.equal(fixture.meta.getAttribute('content'), '#08090c');
  assert.equal(events, 1);
  assert.equal(fixture.theme.toggleTheme(), 'light');
});
test('theme persists when storage is available', () => {
  const fixture = themeFixture();
  fixture.theme.applyTheme('dark');
  assert.equal(fixture.saved.get('theme'), 'dark');
});

function headerFixture(storageFails = false) {
  const env = environment();
  const toggle = env.element();
  toggle.setAttribute('aria-label', 'Abrir menu');
  toggle.dataset.closeLabel = 'Fechar menu';
  const menu = env.element();
  menu.inert = true;
  const main = env.element();
  const footer = env.element();
  footer.inert = true; // Existing inert state must survive opening/closing.
  const header = env.element();
  const cmdk = env.element();
  const links = [env.element(), env.element()];
  links[0].setAttribute('href', '#projects');
  links[1].setAttribute('href', 'https://github.com/lucianookdp');
  const section = env.element();
  menu.querySelectorAll = () => links;
  menu.contains = target => target === menu || links.includes(target);
  env.document.getElementById = id => ({ 'site-header': header, 'open-command-palette': cmdk, 'menu-toggle': toggle, 'mobile-menu': menu }[id] ?? null);
  env.document.querySelectorAll = selector => selector === '[data-menu-link]' ? [links[0]] : [];
  env.document.querySelector = selector => selector === 'main' ? main : selector === 'footer' ? footer : selector === '#projects' ? section : null;
  const module = execute(astroScript('src/components/layout/Header.astro'), {
    ...env, localStorage: { getItem() { if (storageFails) throw new Error('SecurityError'); return null; }, setItem() { if (storageFails) throw new Error('QuotaExceededError'); } },
    require: () => ({ animate() {}, lockScroll() {}, unlockScroll() {}, scrollToTarget() {} })
  }, 'globalThis.qa = { initHeader };');
  return { ...env, module, toggle, menu, main, footer, links, cmdk, section };
}
test('blocked storage cannot prevent the mobile menu from initializing', () => {
  const fixture = headerFixture(true);
  assert.doesNotThrow(() => fixture.module.initHeader());
  assert.doesNotThrow(() => fixture.cmdk.dispatchEvent({ type: 'click' }));
  fixture.toggle.dispatchEvent({ type: 'click' });
  assert.equal(fixture.toggle.getAttribute('aria-expanded'), 'true');
});
test('mobile menu keeps keyboard focus inside and restores inert state on Escape', () => {
  const fixture = headerFixture();
  fixture.module.initHeader();
  fixture.toggle.dispatchEvent({ type: 'click' });
  assert.equal(fixture.document.activeElement, fixture.links[0]);
  assert.equal(fixture.main.inert, true);
  fixture.links.at(-1).focus();
  let prevented = false;
  fixture.document.dispatchEvent({ type: 'keydown', key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(fixture.document.activeElement, fixture.toggle);
  fixture.document.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });
  assert.equal(fixture.main.inert, false);
  assert.equal(fixture.footer.inert, true);
  assert.equal(fixture.menu.inert, true);
  assert.equal(fixture.document.activeElement, fixture.toggle);
});

function heroFixture({ reduced = false, memory, connection, failImport = false, noWebGL = false } = {}) {
  const env = environment();
  const poster = env.element();
  const canvas = env.element();
  const container = env.element();
  container.querySelector = () => poster;
  let imports = 0;
  let scenes = 0;
  env.window.matchMedia = () => ({ matches: reduced });
  const module = execute(astroScript('src/components/hero/Hero.astro'), {
    ...env, navigator: { deviceMemory: memory, connection },
    require(specifier) {
      if (specifier !== './LaptopScene') return {};
      imports++;
      if (failImport) throw new Error('Failed to fetch dynamically imported module');
      return { createLaptopScene() { scenes++; return noWebGL ? null : { dispose() {} }; } };
    }
  }, 'globalThis.qa = { mountScene, prefersStill, afterFirstPaint, invalidate: () => ++sceneGeneration };');
  return { ...env, module, poster, canvas, container, counts: () => ({ imports, scenes }) };
}
for (const [name, policy] of [
  ['reduced motion', { reduced: true }], ['save data', { connection: { saveData: true } }],
  ['2 GB device', { memory: 2 }], ['3G connection', { connection: { effectiveType: '3g' } }]
]) test(`3D policy: ${name} uses the poster without importing Three.js`, async () => {
  const fixture = heroFixture(policy);
  await fixture.module.mountScene(fixture.container, fixture.canvas, 0);
  assert.equal(fixture.counts().imports, 0);
  assert.equal(fixture.canvas.hidden, true);
  assert.equal(fixture.poster.hidden, false);
  assert.equal(fixture.canvas.getAttribute('aria-hidden'), 'true');
});
for (const [name, policy] of [['download failure', { failImport: true }], ['WebGL unavailable', { noWebGL: true }]]) {
  test(`3D ${name} keeps an accessible poster`, async () => {
    const fixture = heroFixture(policy);
    await fixture.module.mountScene(fixture.container, fixture.canvas, 0);
    assert.equal(fixture.poster.hidden, false);
    assert.equal(fixture.poster.getAttribute('aria-hidden'), null);
    assert.equal(fixture.canvas.hidden, true);
    assert.equal(fixture.container.classList.contains('is-live'), false);
  });
}
test('navigation while the scene module loads cannot mount into the replaced page', async () => {
  const fixture = heroFixture();
  const mounting = fixture.module.mountScene(fixture.container, fixture.canvas, 0);
  fixture.module.invalidate();
  await mounting;
  assert.equal(fixture.counts().scenes, 0);
});
test('hidden tab does not initialize WebGL', async () => {
  const fixture = heroFixture();
  fixture.document.visibilityState = 'hidden';
  await fixture.module.mountScene(fixture.container, fixture.canvas, 0);
  assert.equal(fixture.counts().scenes, 0);
});
test('3D scheduling waits for load, two paints and idle time', () => {
  const fixture = heroFixture();
  fixture.document.readyState = 'loading';
  let calls = 0;
  fixture.module.afterFirstPaint(() => calls++);
  assert.equal(fixture.frames.size, 0);
  fixture.window.dispatchEvent({ type: 'load' });
  fixture.flush(fixture.frames);
  assert.equal(calls, 0);
  fixture.flush(fixture.frames);
  assert.equal(calls, 0);
  fixture.flush(fixture.idle);
  assert.equal(calls, 1);
});
test('leaving the hero cancels scheduled WebGL startup', () => {
  const fixture = heroFixture();
  let calls = 0;
  const cancel = fixture.module.afterFirstPaint(() => calls++);
  fixture.flush(fixture.frames);
  fixture.flush(fixture.frames);
  cancel();
  fixture.flush(fixture.idle);
  assert.equal(calls, 0);
});

for (const mobile of [false, true]) for (const refreshRate of [60, 90, 120, 144]) {
  test(`3D render cap on ${mobile ? 'mobile' : 'desktop'} at ${refreshRate} Hz`, () => {
    const file = source('src/components/hero/LaptopScene.ts');
    const scheduler = file.slice(file.indexOf('  let rafId = 0;'), file.indexOf('\n  layout();', file.indexOf('  let rafId = 0;')));
    let queued;
    let draws = 0;
    const api = execute(scheduler, {
      isSmall: mobile, reducedMotion: false, disposed: false, scrollNeedsUpdate: false, lastFrame: -1,
      document: { visibilityState: 'visible' }, performance: { now: () => 0 },
      requestAnimationFrame(callback) { queued = callback; return 1; }, cancelAnimationFrame() { queued = null; },
      renderFrame() { draws++; }
    }, 'globalThis.qa = { start, stop, visible: () => { inViewport = true; } };');
    api.visible(); api.start();
    for (let frame = 1; frame <= refreshRate; frame++) queued(frame * 1000 / refreshRate);
    assert.equal(draws, mobile ? 30 : 60);
    api.stop();
    assert.equal(queued, null);
  });
}

for (const failure of ['start', 'update', 'animation']) {
  test('theme transition recovers from ' + failure + ' failure without a double toggle', async () => {
    const fixture = themeFixture(true);
    let toggles = 0;
    fixture.document.startViewTransition = callback => {
      if (failure === 'start') throw new Error('transition unavailable');
      if (failure !== 'update') callback();
      return {
        updateCallbackDone: failure === 'update' ? Promise.reject(new Error('update skipped')) : Promise.resolve(),
        finished: Promise.reject(new Error('animation skipped'))
      };
    };
    const component = source('src/components/islands/ThemeToggle.tsx');
    const handler = component.slice(component.indexOf('  function handleClick'), component.indexOf('  return (', component.indexOf('  function handleClick')));
    const api = execute(handler, { ...fixture, setTheme() {}, toggleTheme() { toggles++; return fixture.theme.toggleTheme(); } }, 'globalThis.qa = { handleClick };');
    assert.doesNotThrow(() => api.handleClick({ currentTarget: fixture.element() }));
    await Promise.resolve(); await Promise.resolve();
    assert.equal(toggles, 1);
    assert.equal(fixture.document.documentElement.classList.contains('dark'), true);
    assert.equal(fixture.document.documentElement.classList.contains('theme-transition'), false);
  });
}

for (const mode of ['success', 'denied', 'unavailable']) {
  test('email copy handles clipboard ' + mode, async () => {
    let copied = false, failed = false, written;
    const component = source('src/components/islands/ObfuscatedEmail.tsx');
    const start = component.indexOf('  async function handleCopy');
    const handler = component.slice(start, component.indexOf('  return (', start));
    const clipboard = mode === 'unavailable' ? undefined : { async writeText(value) {
      if (mode === 'denied') throw new Error('NotAllowedError');
      written = value;
    } };
    const api = execute(handler, { email: 'contact@example.test', navigator: { clipboard }, setCopied(value) { copied = value; }, setCopyFailed(value) { failed = value; } }, 'globalThis.qa = { handleCopy };');
    await api.handleCopy();
    assert.equal(copied, mode === 'success');
    assert.equal(failed, mode !== 'success');
    if (mode === 'success') assert.equal(written, 'contact@example.test');
  });
}
