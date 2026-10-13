'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import en from '@/app/[lang]/dictionaries/en.json';

type Dictionary = typeof en;

interface I18nContextType {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  localePath: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = key.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object') {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, dictionary);
      let text = typeof value === 'string' ? value : key;
      if (vars) {
        text = text.replace(/\{(\w+)\}/g, (match, name: string) =>
          vars[name] !== undefined ? String(vars[name]) : match
        );
      }
      return text;
    },
    [dictionary]
  );

  const localePath = useCallback(
    (path: string) => `/${locale}${path === '/' ? '' : path}`,
    [locale]
  );

  const value = useMemo(() => ({ locale, t, localePath }), [locale, t, localePath]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}