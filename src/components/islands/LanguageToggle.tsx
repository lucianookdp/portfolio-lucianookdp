import { motion } from 'motion/react';

interface Props {
  currentLocale: 'pt' | 'en';
  ptPath: string;
  enPath: string;
}

export default function LanguageToggle({ currentLocale, ptPath, enPath }: Props) {
  const isPt = currentLocale === 'pt';

  return (
    <div className="relative flex items-center rounded-full border border-[var(--color-border)] p-0.5 text-xs font-medium">
      <motion.span
        className="absolute inset-y-0.5 w-9 rounded-full bg-[var(--color-accent)] sm:w-8"
        animate={{ x: isPt ? 0 : '100%' }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        aria-hidden="true"
      />
      <a
        href={ptPath}
        aria-current={isPt ? 'page' : undefined}
        className={`tap-scale relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 sm:h-8 sm:w-8 ${
          isPt ? 'text-[var(--color-on-accent)]' : 'text-[var(--color-text-secondary)]'
        }`}
      >
        PT
      </a>
      <a
        href={enPath}
        aria-current={!isPt ? 'page' : undefined}
        className={`tap-scale relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 sm:h-8 sm:w-8 ${
          !isPt ? 'text-[var(--color-on-accent)]' : 'text-[var(--color-text-secondary)]'
        }`}
      >
        EN
      </a>
    </div>
  );
}
