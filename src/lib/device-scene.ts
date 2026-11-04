import type { LaptopSceneHandle } from '../components/hero/LaptopScene';

/** Deferred device composition. HTML remains the fallback in every failure mode. */
export function initDeviceScene() {
  const host = document.querySelector<HTMLElement>('[data-device-scene]');
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas');
  if (!host || !canvas) return () => {};
  const target = host;
  const surface = canvas;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width:900px)');
  const nav = navigator as Navigator & {deviceMemory?: number; connection?: {saveData?: boolean; effectiveType?: string}};
  let handle: LaptopSceneHandle | null = null;
  let visible = false, disposed = false, pending = false, generation = 0;
  let timer = 0;
  function permitted() {
    return !disposed && visible && wide.matches && !reduced.matches && document.visibilityState === 'visible'
      && !(nav.deviceMemory && nav.deviceMemory <= 2) && !nav.connection?.saveData
      && !['slow-2g','2g','3g'].includes(nav.connection?.effectiveType ?? '');
  }
  function release() {
    ++generation; pending = false;
    clearTimeout(timer);
    handle?.dispose(); handle = null;
    target.classList.remove('is-live');
  }
  async function mount(token: number) {
    try {
      const { createLaptopScene } = await import('../components/hero/LaptopScene');
      if (token !== generation || !target.isConnected || !permitted()) return;
      surface.hidden = false;
      handle = createLaptopScene(target, surface, {
        name: '', role: '', devices: true,
        screen: JSON.parse(target.dataset.screen ?? '{}')
      });
      target.classList.toggle('is-live', !!handle);
    } catch { target.classList.remove('is-live'); }
    finally { if (token === generation) pending = false; }
  }
  function sync() {
    if (!permitted()) { release(); return; }
    if (handle || pending) return;
    pending = true;
    const token = ++generation;
    timer = window.setTimeout(() => { void mount(token); }, 120);
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(target);
  reduced.addEventListener('change', sync);
  wide.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  return () => {
    disposed = true; release(); observer.disconnect();
    reduced.removeEventListener('change', sync);
    wide.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
  };
}
