import { animate, scroll } from 'motion';

type Cleanup = () => void;

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/*  Magnetic buttons: [data-magnetic] drifts toward the pointer.        */
/* ------------------------------------------------------------------ */
function initMagnetic(): Cleanup {
  if (!finePointer() || reducedMotion()) return () => {};
  const cleanups: Cleanup[] = [];

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.35;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };
    const onLeave = () => {
      animate(el, { transform: 'translate3d(0px, 0px, 0)' }, { type: 'spring', stiffness: 260, damping: 18 });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ */
/*  Reveal on scroll: [data-reveal] fades up, optional data-reveal-delay */
/* ------------------------------------------------------------------ */
function initReveal(): Cleanup {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)'));
  if (els.length === 0) return () => {};

  if (reducedMotion()) {
    els.forEach((el) => el.classList.add('is-revealed'));
    return () => {};
  }

  els.forEach((el) => {
    const delay = el.dataset.revealDelay;
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -48px 0px' }
  );

  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) el.classList.add('is-revealed');
    else observer.observe(el);
  });

  // Safety net for throttled observers (backgrounded tabs): never leave
  // content invisible.
  const timer = window.setTimeout(() => {
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-revealed');
    });
  }, 2500);

  return () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

/* ------------------------------------------------------------------ */
/*  Spotlight cards: feed pointer position into --spot-x / --spot-y     */
/* ------------------------------------------------------------------ */
function initSpotlight(): Cleanup {
  if (!finePointer() || reducedMotion()) return () => {};
  const cleanups: Cleanup[] = [];
  document.querySelectorAll<HTMLElement>('.spot-card').forEach((card) => {
    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    };
    card.addEventListener('pointermove', onMove);
    cleanups.push(() => card.removeEventListener('pointermove', onMove));
  });
  return () => cleanups.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ */
/*  3D tilt: .tilt rotates toward the pointer with a moving glare.      */
/* ------------------------------------------------------------------ */
function initTilt(): Cleanup {
  if (!finePointer() || reducedMotion()) return () => {};
  const cleanups: Cleanup[] = [];

  document.querySelectorAll<HTMLElement>('.tilt').forEach((el) => {
    const max = Number(el.dataset.tiltMax) || 8;
    const parent = el.parentElement ?? el;
    parent.style.perspective = '1200px';

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;
      el.style.transition = 'transform 120ms ease-out';
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      el.style.setProperty('--glare-x', `${px * 100}%`);
      el.style.setProperty('--glare-y', `${py * 100}%`);
    };
    const onLeave = () => {
      el.style.transition = '';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ */
/*  Stacked project panels: each sticky card shrinks as the next one    */
/*  slides over it, including on phones.                               */
/* ------------------------------------------------------------------ */
function initStack(): Cleanup {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.stack-item'));
  items.forEach((item, index) => item.style.setProperty('--stack-index', String(index)));
  if (items.length < 2 || reducedMotion()) return () => {};

  const sizes = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      const item = target as HTMLElement;
      item.style.setProperty('--stack-height', `${item.offsetHeight}px`);
    });
  });
  items.forEach((item) => sizes.observe(item));

  let stops: Cleanup[] = [];
  const stackViewport = window.matchMedia('(min-height: 541px)');

  const bind = () => {
    stops.forEach((stop) => stop());
    stops = [];
    items.forEach((item) => {
      item.style.transform = '';
      item.style.setProperty('--stack-shade', '0');
    });

    if (!stackViewport.matches) return;
    items.forEach((item, index) => {
      const next = items[index + 1];
      if (!next) return;
      const stop = scroll(
        animate(item, { transform: ['scale(1)', 'scale(0.92)'], '--stack-shade': [0, 0.6] }, { ease: 'linear' }),
        { target: next, offset: ['start end', 'start 20%'] }
      );
      stops.push(stop);
    });
  };

  bind();
  stackViewport.addEventListener('change', bind);

  return () => {
    sizes.disconnect();
    stackViewport.removeEventListener('change', bind);
    stops.forEach((stop) => stop());
  };
}

/* Touch screens use scroll progress in place of pointer hover. */
function initServiceScroll(): Cleanup {
  if (reducedMotion()) return () => {};
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.offering'));
  const touch = window.matchMedia('(hover: none) and (pointer: coarse)');
  let stops: Cleanup[] = [];
  const bind = () => {
    stops.forEach((stop) => stop());
    stops = [];
    cards.forEach((card) => {
      card.style.transform = '';
      card.style.removeProperty('--mobile-glow');
      if (!touch.matches) return;
      stops.push(scroll(
        animate(card, {
          transform: ['perspective(1200px) rotateX(4deg) scale(0.98)', 'perspective(1200px) rotateX(0deg) scale(1)', 'perspective(1200px) rotateX(-4deg) scale(0.98)'],
          '--mobile-glow': [0, 1, 0]
        }, { ease: 'linear' }),
        { target: card.parentElement!, offset: ['start end', 'end start'] }
      ));
    });
  };
  bind();
  touch.addEventListener('change', bind);
  return () => {
    touch.removeEventListener('change', bind);
    stops.forEach((stop) => stop());
  };
}

/* ------------------------------------------------------------------ */
/*  Local time clock for [data-local-time]                              */
/* ------------------------------------------------------------------ */
function initClock(): Cleanup {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-local-time]'));
  if (els.length === 0) return () => {};

  const formatter = new Intl.DateTimeFormat(document.documentElement.lang.startsWith('pt') ? 'pt-BR' : 'en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
  const tick = () => {
    const value = formatter.format(new Date());
    els.forEach((el) => {
      el.textContent = value;
    });
  };
  tick();
  const id = window.setInterval(tick, 15000);
  return () => window.clearInterval(id);
}

/* ------------------------------------------------------------------ */
/*  Character split for big headings ([data-split-chars])               */
/* ------------------------------------------------------------------ */
export function splitChars(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === 'true') return Array.from(el.querySelectorAll<HTMLElement>('.char'));
  el.dataset.split = 'true';
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text.trim());
  el.textContent = '';
  const chars: HTMLElement[] = [];
  text.split(/(\s+)/).forEach((token) => {
    if (!token) return;
    if (/^\s+$/.test(token)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const word = document.createElement('span');
    word.className = 'word';
    word.setAttribute('aria-hidden', 'true');
    for (const ch of token) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      word.appendChild(span);
      chars.push(span);
    }
    el.appendChild(word);
  });
  return chars;
}

/* ------------------------------------------------------------------ */
/*  Master init — the layout calls this on every astro:page-load.       */
/* ------------------------------------------------------------------ */
let teardown: Cleanup | null = null;

export function initInteractions(): void {
  destroyInteractions();
  const cleanups = [initMagnetic(), initReveal(), initSpotlight(), initTilt(), initStack(), initServiceScroll(), initClock()];
  teardown = () => cleanups.forEach((fn) => fn());
}

export function destroyInteractions(): void {
  teardown?.();
  teardown = null;
}
