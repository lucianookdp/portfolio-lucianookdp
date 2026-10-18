interface ProcessAutoplayOptions {
  root: HTMLElement;
  button: HTMLButtonElement;
  advance: () => void;
  duration?: number;
}

export function createProcessAutoplay({ root, button, advance, duration = 6000 }: ProcessAutoplayOptions) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = root.querySelector<HTMLElement>('[data-process-timer]');
  const controls = root.querySelector<HTMLElement>('[data-process-controls]');
  let visible = false;
  let paused = false;
  let disposed = false;
  let timeout = 0;

  function sync() {
    window.clearTimeout(timeout);
    timeout = 0;
    if (disposed) return;
    const playing = visible && !paused && !reduced.matches && document.visibilityState === 'visible';
    root.dataset.autoplayState = playing ? 'playing' : 'paused';
    if (controls) controls.hidden = reduced.matches;
    button.textContent = (paused ? button.dataset.playLabel : button.dataset.pauseLabel) ?? '';
    button.setAttribute('aria-label', button.textContent);
    if (progress) {
      progress.style.setProperty('--process-duration', duration + 'ms');
      progress.style.animationName = 'none';
      void progress.offsetWidth;
      progress.style.animationName = '';
    }
    if (playing) timeout = window.setTimeout(() => { advance(); sync(); }, duration);
  }
  function pause() { paused = true; sync(); }
  function toggle() { paused = !paused; sync(); }
  function interaction(event: Event) {
    if (event.target && button.contains(event.target as Node)) return;
    pause();
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
    sync();
  }, { threshold: 0.15 });
  observer.observe(root);
  button.addEventListener('click', toggle);
  const interactionEvents = ['click', 'focusin', 'keydown'] as const;
  interactionEvents.forEach(type => root.addEventListener(type, interaction, { passive: true }));
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();

  return {
    pause,
    destroy() {
      disposed = true;
      window.clearTimeout(timeout);
      root.dataset.autoplayState = 'paused';
      observer.disconnect();
      button.removeEventListener('click', toggle);
      interactionEvents.forEach(type => root.removeEventListener(type, interaction));
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    }
  };
}
