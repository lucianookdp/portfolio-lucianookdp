/** One reversible scroll timeline. HTML stays complete when enhancement is unavailable. */
export function initServiceStory() {
  const element = document.querySelector<HTMLElement>('[data-service-story]');
  if (!element) return () => {};
  const root = element;
  const articles = Array.from(root.querySelectorAll<HTMLElement>('[data-service]'));
  const columns = articles.map(a => a.querySelector<HTMLElement>('.service-visual-col')!);
  const figures = columns.map(c => c.querySelector<HTMLElement>('[data-service-visual]')!);
  const desktop = matchMedia('(min-width:1024px) and (min-height:800px)');
  const sideBySide = matchMedia('(min-width:768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.createElement('div');
  stage.className = 'service-stage';
  stage.setAttribute('aria-label', root.dataset.label ?? '');
  root.append(stage);
  let connected = false;
  let raf = 0;
  let visible = false;
  const manual = new Map<HTMLElement, number>();
  const removeControls: (() => void)[] = [];
  const clamp = (n: number) => Math.max(0, Math.min(1, n));

  function paint(figure: HTMLElement, progress: number) {
    const step = Math.min(2, Math.floor(progress * 3));
    figure.dataset.step = String(step);
    figure.style.setProperty('--story-progress', String(progress));
    figure.querySelectorAll<HTMLElement>('[data-sequence]').forEach((el, i) => {
      el.classList.toggle('is-current', step === i);
    });
    figure.querySelectorAll<HTMLElement>('[data-cue]').forEach(el => {
      el.classList.toggle('is-cued', Number(el.dataset.cue) === step);
    });
    figure.querySelectorAll<HTMLElement>('[data-story-step]').forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === step));
    });
  }
  figures.forEach(figure => {
    figure.querySelectorAll<HTMLButtonElement>('[data-story-step]').forEach((button, i) => {
      const select = () => {
        if (reduced.matches) return;
        const progress = (i + .5) / 3;
        manual.set(figure, progress);
        paint(figure, progress);
      };
      button.addEventListener('click', select);
      removeControls.push(() => button.removeEventListener('click', select));
    });
  });
  function update() {
    raf = 0;
    if (document.visibilityState !== 'visible' || reduced.matches) return;
    if (connected) {
      const anchor = innerHeight * .32;
      const rects = articles.map(a => a.getBoundingClientRect());
      let index = 0;
      rects.forEach((rect,i) => { if (rect.top <= anchor) index = i; });
      columns.forEach((c,i) => {
        c.classList.toggle('is-current', i === index);
        c.setAttribute('aria-hidden', String(i !== index));
      });
      const rect = rects[index];
      const readingLine = innerHeight * .18;
      paint(figures[index], manual.get(figures[index]) ?? clamp((readingLine - rect.top) / Math.max(1, rect.height - readingLine)));
    } else {
      figures.forEach((f, i) => {
        const rect = f.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          // Sticky illustrations don't move with the document: follow their article.
          const article = articles[i].getBoundingClientRect();
          const progress = sideBySide.matches
            ? (innerHeight * .18 - article.top) / Math.max(1, article.height - innerHeight * .18)
            : (innerHeight * .55 - rect.top) / (rect.height * .7);
          paint(f, manual.get(f) ?? clamp(progress));
        }
      });
    }
  }
  function schedule() {
    if (!raf && visible && !reduced.matches && document.visibilityState === 'visible') raf = requestAnimationFrame(update);
  }
  function layout() {
    manual.clear();
    connected = desktop.matches && !reduced.matches;
    root.classList.toggle('is-connected', connected);
    columns.forEach((c,i) => {
      (connected ? stage : articles[i]).append(c);
      c.removeAttribute('aria-hidden');
      c.classList.remove('is-current');
      figures[i].classList.toggle('sv-animated', !reduced.matches);
      if (reduced.matches) {
        delete figures[i].dataset.step;
        figures[i].style.removeProperty('--story-progress');
      }
    });
    update();
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else { cancelAnimationFrame(raf); raf = 0; }
  });
  observer.observe(root);
  const resize = new ResizeObserver(schedule);
  articles.forEach(a => resize.observe(a));
  // Scroll resumes the narrative; resize alone must not undo a chosen step.
  function onScroll() { manual.clear(); schedule(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', schedule);
  desktop.addEventListener('change', layout);
  reduced.addEventListener('change', layout);
  layout();
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect(); resize.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', schedule);
    desktop.removeEventListener('change', layout);
    reduced.removeEventListener('change', layout);
    removeControls.forEach(remove => remove());
    columns.forEach((c,i) => { articles[i].append(c); c.removeAttribute('aria-hidden'); });
    root.classList.remove('is-connected');
    stage.remove();
  };
}
