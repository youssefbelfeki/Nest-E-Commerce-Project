export const locales = ['en', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);