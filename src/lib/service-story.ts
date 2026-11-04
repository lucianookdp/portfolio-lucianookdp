/** One reversible scroll timeline. HTML stays complete when enhancement is unavailable. */
export function initServiceStory() {
  const element = document.querySelector<HTMLElement>('[data-service-story]');
  if (!element) return () => {};
  const root = element;
  const articles = Array.from(root.querySelectorAll<HTMLElement>('[data-service]'));
  const columns = articles.map(a => a.querySelector<HTMLElement>('.service-visual-col')!);
  const figures = columns.map(c => c.querySelector<HTMLElement>('[data-service-visual]')!);
  const desktop = matchMedia('(min-width:1024px) and (min-height:800px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.createElement('div');
  stage.className = 'service-stage';
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', root.dataset.label ?? '');
  root.append(stage);
  let connected = false;
  let raf = 0;
  let visible = false;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  // Each card marks its three parts (summary, lists, next step) with
  // data-story-step; the mockup step follows whichever part the reader has
  // reached. Without markers, the article is split into equal thirds.
  function articleProgress(article: HTMLElement, rect: DOMRect, anchor: number) {
    const marks = Array.from(article.querySelectorAll<HTMLElement>('[data-story-step]'))
      .map(el => el.getBoundingClientRect())
      .filter(r => r.height > 0)
      .map(r => r.top);
    if (marks.length < 2) return clamp((anchor - rect.top) / Math.max(1, rect.height - 80));
    const ends = [...marks.slice(1), rect.bottom];
    let step = 0;
    marks.forEach((top, i) => { if (top <= anchor) step = i; });
    const within = clamp((anchor - marks[step]) / Math.max(1, ends[step] - marks[step]));
    return clamp((step + within) / marks.length);
  }

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
  }
  function update() {
    raf = 0;
    if (document.visibilityState !== 'visible' || reduced.matches) return;
    if (connected) {
      const anchor = innerHeight * .42;
      const rects = articles.map(a => a.getBoundingClientRect());
      let index = 0;
      rects.forEach((rect,i) => { if (rect.top <= anchor) index = i; });
      columns.forEach((c,i) => {
        c.classList.toggle('is-current', i === index);
        c.setAttribute('aria-hidden', String(i !== index));
      });
      const rect = rects[index];
      paint(figures[index], articleProgress(articles[index], rect, anchor));
    } else {
      figures.forEach(f => {
        const rect = f.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          paint(f, clamp((innerHeight * .85 - rect.top) / (rect.height + innerHeight * .15)));
        }
      });
    }
  }
  function schedule() {
    if (!raf && visible && !reduced.matches && document.visibilityState === 'visible') raf = requestAnimationFrame(update);
  }
  function layout() {
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
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', schedule);
  desktop.addEventListener('change', layout);
  reduced.addEventListener('change', layout);
  layout();
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect(); resize.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', schedule);
    desktop.removeEventListener('change', layout);
    reduced.removeEventListener('change', layout);
    columns.forEach((c,i) => { articles[i].append(c); c.removeAttribute('aria-hidden'); });
    root.classList.remove('is-connected');
    stage.remove();
  };
}
