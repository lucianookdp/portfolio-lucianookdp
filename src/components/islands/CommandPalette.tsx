import { useEffect, useRef, useState, type ComponentType } from 'react';

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

interface Props {
  dict: Dict;
  navItems: { id: string; label: string }[];
  currentLocale: 'pt' | 'en';
  ptPath: string;
  enPath: string;
}

export interface CommandPaletteDialogProps extends Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

type PaletteDialog = ComponentType<CommandPaletteDialogProps>;
let dialogPromise: Promise<PaletteDialog> | undefined;

function loadDialog() {
  // Share the download across openings and Astro navigations.
  return (dialogPromise ??= import('./CommandPaletteDialog')
    .then((module) => module.default)
    .catch((error) => {
      dialogPromise = undefined;
      throw error;
    }));
}

export default function CommandPalette(props: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [Dialog, setDialog] = useState<PaletteDialog | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!event.repeat) setOpen((previous) => !previous);
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

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open || Dialog) return;
    let active = true;
    setFailed(false);
    loadDialog().then(
      (component) => {
        if (active) setDialog(() => component);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [open, Dialog]);

  if (!open) return null;

  if (Dialog) {
    return <Dialog {...props} open={open} onOpenChange={setOpen} search={search} onSearchChange={setSearch} />;
  }

  return (
    <LoadingPalette
      dict={props.dict}
      currentLocale={props.currentLocale}
      search={search}
      onSearchChange={setSearch}
      onClose={() => setOpen(false)}
      failed={failed}
    />
  );
}

function LoadingPalette({ dict, currentLocale, search, onSearchChange, onClose, failed }: {
  dict: Dict;
  currentLocale: Props['currentLocale'];
  search: string;
  onSearchChange: (search: string) => void;
  onClose: () => void;
  failed: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const english = currentLocale === 'en';

  useEffect(() => {
    const dialog = dialogRef.current;
    // Native modal focus trapping works before the heavier cmdk dialog arrives.
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={dict.label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="glass fixed left-1/2 top-24 m-0 w-[min(92vw,34rem)] max-w-none -translate-x-1/2 overflow-hidden rounded-2xl border-0 p-0 text-[var(--color-text)] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
        <input
          autoFocus
          aria-label={dict.placeholder}
          placeholder={dict.placeholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full bg-transparent py-4 font-sans text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        />
        <button type="button" onClick={onClose} aria-label={english ? 'Close' : 'Fechar'} className="rounded-md border border-[var(--color-border-strong)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)]">esc</button>
      </div>
      <div className="px-3 py-6 text-center font-sans text-sm text-[var(--color-text-secondary)]">
        <p role={failed ? 'alert' : 'status'}>
          {failed
            ? english ? 'Could not load commands.' : 'Não foi possível carregar os comandos.'
            : english ? 'Loading commands…' : 'Carregando comandos…'}
        </p>
        {failed && <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-xl border border-[var(--color-border-strong)] px-3 py-2 text-[var(--color-accent-text)]">{english ? 'Reload page' : 'Recarregar página'}</button>}
      </div>
    </dialog>
  );
}
