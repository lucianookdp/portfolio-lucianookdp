import Lenis from 'lenis';

// One Lenis instance per page. Astro's ClientRouter swaps the document on
// navigation, so the layout destroys it on astro:before-swap and recreates it
// on astro:page-load; anything that scrolls programmatically goes through
// scrollToTarget() so it works with or without smooth scrolling active.
let lenis: Lenis | null = null;
let rafId = 0;

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
    anchors: { offset: HEADER_OFFSET, duration: 1.4 }
  });

  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
}

export function destroyLenis(): void {
  cancelAnimationFrame(rafId);
  lenis?.destroy();
  lenis = null;
}

export function scrollToTarget(target: string | HTMLElement | number, options: { offset?: number; immediate?: boolean } = {}): void {
  const offset = options.offset ?? HEADER_OFFSET;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4, immediate: options.immediate });
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
