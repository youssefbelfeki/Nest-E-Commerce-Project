import 'server-only';

import en from './dictionaries/en.json';
import fr from './dictionaries/fr.json';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
} as const;

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = async (locale: string): Promise<typeof en> => {
  if (hasLocale(locale)) {
    return dictionaries[locale]();
  }
  return en;
};

export const defaultDictionary: typeof en = en;
export const frenchDictionary: typeof fr = fr;