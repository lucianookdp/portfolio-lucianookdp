import { useEffect, useState } from 'react';

interface Props {
  userPart: string;
  domainPart: string;
  tldPart: string;
  loadingLabel: string;
  copyLabel: string;
  copiedLabel: string;
  sendLabel: string;
  copyErrorLabel: string;
}

export default function ObfuscatedEmail({ userPart, domainPart, tldPart, loadingLabel, copyLabel, copiedLabel, sendLabel, copyErrorLabel }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

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
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <a
        href={`mailto:${email}`}
        className="tap-scale w-fit break-all font-display text-base min-[400px]:text-xl font-medium tracking-tight text-[var(--color-text)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-8 transition-colors hover:text-[var(--color-accent-text)] sm:text-4xl"
      >
        {email}
      </a>
      <div className="flex flex-wrap items-center gap-3">
        <a href={`mailto:${email}`} className="btn btn-accent">
          {sendLabel}
          <svg className="btn-arrow h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>
        <button type="button" onClick={handleCopy} aria-live="polite" className="btn btn-ghost">
          {copied ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      {copyFailed && <p role="status" className="text-sm text-[var(--color-text-secondary)]">{copyErrorLabel}</p>}
    </div>
  );
}
