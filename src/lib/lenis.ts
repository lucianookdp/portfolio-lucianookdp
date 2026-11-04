import Lenis from 'lenis';

// One Lenis instance per page. Astro's ClientRouter swaps the document on
// navigation, so the layout destroys it on astro:before-swap and recreates it
// on astro:page-load; anything that scrolls programmatically goes through
// scrollToTarget() so it works with or without smooth scrolling active.
let lenis: Lenis | null = null;
let rafId = 0;
let hashFrame = 0;

function alignHash(): void {
  cancelAnimationFrame(hashFrame);
  hashFrame = requestAnimationFrame(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (target) scrollToTarget(target, { immediate: true });
  });
}

export const HEADER_OFFSET = -96;

export function getLenis(): Lenis | null {
  return lenis;
}

export function initLenis(): void {
  destroyLenis();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  lenis = new Lenis({
    lerp: 0.09,
    smoothWheel: true,
    // Lenis already honors the target's scroll-margin-top for anchor clicks.
    anchors: { offset: 0, duration: 1.4 }
  });

  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
  // Native hash navigation must cancel any remaining wheel inertia. Wait one
  // frame for responsive enhancement to finish moving the service illustrations.
  window.addEventListener('hashchange', alignHash);
  if (location.hash) alignHash();
}

export function destroyLenis(): void {
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(hashFrame);
  window.removeEventListener('hashchange', alignHash);
  lenis?.destroy();
  lenis = null;
}

export function scrollToTarget(target: string | HTMLElement | number, options: { offset?: number; immediate?: boolean } = {}): void {
  const offset = options.offset ?? HEADER_OFFSET;
  if (lenis) {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    const top = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY : null;
    if (top !== null) lenis.scrollTo(top, { offset: typeof target === 'number' ? 0 : offset, duration: 1.4, immediate: options.immediate });
    return;
  }

  const behavior: ScrollBehavior = options.immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior });
}

export function lockScroll(): void {
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  lenis?.start();
  document.documentElement.style.overflow = '';
}
