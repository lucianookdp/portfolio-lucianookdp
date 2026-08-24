import { useEffect, useState } from 'react';

interface Props {
  userPart: string;
  domainPart: string;
  tldPart: string;
  loadingLabel: string;
  copyLabel: string;
  copiedLabel: string;
}

export default function ObfuscatedEmail({ userPart, domainPart, tldPart, loadingLabel, copyLabel, copiedLabel }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEmail(`${userPart}@${domainPart}.${tldPart}`);
  }, [userPart, domainPart, tldPart]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  if (!email) {
    return <span className="font-sans text-lg text-[var(--color-text-secondary)]">{loadingLabel}</span>;
  }

  async function handleCopy() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // Clipboard access can be denied by the browser; the mailto link still works.
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <a
        href={`mailto:${email}`}
        className="tap-scale break-all font-display text-2xl text-[var(--color-accent)] underline-offset-4 hover:underline sm:text-3xl"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        className="tap-scale flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </span>
  );
}
