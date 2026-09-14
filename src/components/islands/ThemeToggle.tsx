import { useEffect, useState } from 'react';
import { getStoredTheme, toggleTheme, type Theme } from '../../lib/theme';

interface Props {
  labelLight: string;
  labelDark: string;
}

export default function ThemeToggle({ labelLight, labelDark }: Props) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const label = theme === 'dark' ? labelLight : labelDark;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const supportsViewTransitions = typeof document.startViewTransition === 'function';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!supportsViewTransitions || prefersReducedMotion) {
      setTheme(toggleTheme());
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--theme-toggle-x', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--theme-toggle-y', `${rect.top + rect.height / 2}px`);
    document.documentElement.classList.add('theme-transition');

    const transition = document.startViewTransition(() => {
      setTheme(toggleTheme());
    });
    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transition');
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="tap-scale flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[var(--color-text)] transition-colors duration-200 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
