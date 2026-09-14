import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { navigate } from 'astro:transitions/client';
import { getStoredTheme, toggleTheme, type Theme } from '../../lib/theme';
import { scrollToTarget } from '../../lib/lenis';

interface Dict {
  label: string;
  placeholder: string;
  empty: string;
  groupNavigation: string;
  groupActions: string;
  groupLinks: string;
  toggleThemeLight: string;
  toggleThemeDark: string;
  switchLanguage: string;
  openGithub: string;
  sendEmail: string;
  hint: string;
}

interface NavItem {
  id: string;
  label: string;
}

interface Props {
  dict: Dict;
  navItems: NavItem[];
  currentLocale: 'pt' | 'en';
  ptPath: string;
  enPath: string;
}

const groupClass =
  '[&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-[var(--color-text-secondary)]';
const itemClass =
  'flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 font-sans text-sm text-[var(--color-text)] transition-colors data-[selected=true]:bg-[var(--color-accent-soft)] data-[selected=true]:text-[var(--color-accent-text)]';

export default function CommandPalette({ dict, navItems, currentLocale, ptPath, enPath }: Props) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onExternalOpen() {
      setOpen(true);
    }

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('command-palette:open', onExternalOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('command-palette:open', onExternalOpen);
    };
  }, []);

  function goToSection(id: string) {
    setOpen(false);
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  }

  function handleToggleTheme() {
    setTheme(toggleTheme());
    setOpen(false);
  }

  function handleSwitchLanguage() {
    setOpen(false);
    const next = currentLocale === 'pt' ? 'en' : 'pt';
    try {
      localStorage.setItem('lang', next);
    } catch {
      // Storage can be unavailable; navigation still works.
    }
    navigate(next === 'en' ? enPath : ptPath);
  }

  function openExternal(url: string) {
    setOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function sendEmail() {
    setOpen(false);
    window.location.href = `mailto:${'engslucianok'}@${'gmail.com'}`;
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label={dict.label}
      className="glass fixed left-1/2 top-24 z-[100] w-[min(92vw,34rem)] -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl"
      overlayClassName="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      contentClassName="p-0"
    >
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Command.Input
          placeholder={dict.placeholder}
          className="w-full bg-transparent py-4 font-sans text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        />
        <kbd className="hidden rounded-md border border-[var(--color-border-strong)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)] sm:block">esc</kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2" data-lenis-prevent>
        <Command.Empty className="px-3 py-6 text-center font-sans text-sm text-[var(--color-text-secondary)]">{dict.empty}</Command.Empty>

        <Command.Group heading={dict.groupNavigation} className={groupClass}>
          {navItems.map((item, index) => (
            <Command.Item key={item.id} onSelect={() => goToSection(item.id)} className={itemClass}>
              <span>{item.label}</span>
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">0{index + 1}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="my-2 h-px bg-[var(--color-border)]" />

        <Command.Group heading={dict.groupActions} className={groupClass}>
          <Command.Item onSelect={handleToggleTheme} className={itemClass}>
            {theme === 'dark' ? dict.toggleThemeLight : dict.toggleThemeDark}
          </Command.Item>
          <Command.Item onSelect={handleSwitchLanguage} className={itemClass}>
            {dict.switchLanguage}
          </Command.Item>
        </Command.Group>

        <Command.Separator className="my-2 h-px bg-[var(--color-border)]" />

        <Command.Group heading={dict.groupLinks} className={groupClass}>
          <Command.Item onSelect={() => openExternal('https://github.com/lucianookdp')} className={itemClass}>
            <span>{dict.openGithub}</span>
            <span aria-hidden="true">↗</span>
          </Command.Item>
          <Command.Item onSelect={sendEmail} className={itemClass}>
            <span>{dict.sendEmail}</span>
            <span aria-hidden="true">↗</span>
          </Command.Item>
        </Command.Group>
      </Command.List>
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] px-4 py-2.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
        <kbd className="rounded border border-[var(--color-border-strong)] px-1">↑↓</kbd>
        <kbd className="rounded border border-[var(--color-border-strong)] px-1">↵</kbd>
        <span>·</span>
        <span>g + a/p/v/s/c</span>
      </div>
    </Command.Dialog>
  );
}
