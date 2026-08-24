import en from './en.json';
import pt from './pt.json';

export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

const dictionaries = { pt, en } satisfies Record<Locale, typeof en>;

export type Dictionary = typeof en;

export function getLocale(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment === 'en' ? 'en' : defaultLocale;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'pt' ? 'en' : 'pt';
}

export function localizePath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return locale === defaultLocale ? `/${clean}`.replace(/\/+/g, '/') : `/en${clean}`.replace(/\/+/g, '/');
}
