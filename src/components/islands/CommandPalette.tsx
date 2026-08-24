import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { navigate } from 'astro:transitions/client';
import { getStoredTheme, toggleTheme, type Theme } from '../../lib/theme';

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
    window.location.hash = '';
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleToggleTheme() {
    setTheme(toggleTheme());
    setOpen(false);
  }

  function handleSwitchLanguage() {
    setOpen(false);
    navigate(currentLocale === 'pt' ? enPath : ptPath);
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
      className="fixed left-1/2 top-24 z-[100] w-[min(90vw,32rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-2xl"
      overlayClassName="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
      contentClassName="p-0"
    >
      <Command.Input
        placeholder={dict.placeholder}
        className="w-full border-b border-[var(--color-border)] bg-transparent px-5 py-4 font-sans text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center font-sans text-sm text-[var(--color-text-secondary)]">
          {dict.empty}
        </Command.Empty>

        <Command.Group
          heading={dict.groupNavigation}
          className="[&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-text-secondary)]"
        >
          {navItems.map((item) => (
            <Command.Item
              key={item.id}
              onSelect={() => goToSection(item.id)}
              className="cursor-pointer rounded-lg px-3 py-2.5 font-sans text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-border)]"
            >
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="my-2 h-px bg-[var(--color-border)]" />

        <Command.Group
          heading={dict.groupActions}
          className="[&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-text-secondary)]"
        >
          <Command.Item
            onSelect={handleToggleTheme}
            className="cursor-pointer rounded-lg px-3 py-2.5 font-sans text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-border)]"
          >
            {theme === 'dark' ? dict.toggleThemeLight : dict.toggleThemeDark}
          </Command.Item>
          <Command.Item
            onSelect={handleSwitchLanguage}
            className="cursor-pointer rounded-lg px-3 py-2.5 font-sans text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-border)]"
          >
            {dict.switchLanguage}
          </Command.Item>
        </Command.Group>

        <Command.Separator className="my-2 h-px bg-[var(--color-border)]" />

        <Command.Group
          heading={dict.groupLinks}
          className="[&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-text-secondary)]"
        >
          <Command.Item
            onSelect={() => openExternal('https://github.com/lucianookdp')}
            className="cursor-pointer rounded-lg px-3 py-2.5 font-sans text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-border)]"
          >
            {dict.openGithub}
          </Command.Item>
          <Command.Item
            onSelect={sendEmail}
            className="cursor-pointer rounded-lg px-3 py-2.5 font-sans text-sm text-[var(--color-text)] data-[selected=true]:bg-[var(--color-border)]"
          >
            {dict.sendEmail}
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
