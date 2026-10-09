interface Props {
  currentLocale: 'pt' | 'en';
  ptPath: string;
  enPath: string;
}

function remember(locale: 'pt' | 'en') {
  try {
    localStorage.setItem('lang', locale);
  } catch {
    // Storage can be unavailable (private mode); the link still navigates.
  }
}

export default function LanguageToggle({ currentLocale, ptPath, enPath }: Props) {
  const isPt = currentLocale === 'pt';

  return (
    <div className="relative flex items-center rounded-full border border-[var(--color-border-strong)] p-0.5 font-mono text-[11px] font-medium">
      <span
        className="absolute inset-y-0.5 w-8 rounded-full bg-[var(--color-accent)] transition-transform duration-300 motion-reduce:transition-none"
        style={{ transform: isPt ? 'translateX(0)' : 'translateX(100%)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        aria-hidden="true"
      />
      <a
        href={ptPath}
        onClick={() => remember('pt')}
        aria-current={isPt ? 'page' : undefined}
        className={`tap-scale relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
          isPt ? 'text-[var(--color-on-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        }`}
      >
        PT
      </a>
      <a
        href={enPath}
        onClick={() => remember('en')}
        aria-current={!isPt ? 'page' : undefined}
        className={`tap-scale relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
          !isPt ? 'text-[var(--color-on-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        }`}
      >
        EN
      </a>
    </div>
  );
}
