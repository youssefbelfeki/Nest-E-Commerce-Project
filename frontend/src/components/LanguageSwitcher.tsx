'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useI18n } from '@/context/I18nContext';
import { LOCALE_COOKIE, locales } from '@/lib/i18n';

const languageLabels: Record<string, string> = {
  en: 'English',
  fr: 'Français',
};

export function LanguageSwitcher() {
  const { locale, localePath } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const switchLanguage = (target: string) => {
    setOpen(false);
    if (target === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${target}`);
    window.location.href = newPath;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Switch language"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`p-2 rounded-lg transition-colors ${
          open
            ? 'bg-slate-800/50 text-white'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v3M3.055 13a9 9 0 1017.89 0M3.055 13a9 9 0 0118.01 0m-18.01 0h1.944a2 2 0 002-2v-.5a2 2 0 012-2h.5m7.5 0h.5a2 2 0 012 2v.5a2 2 0 002 2h1.944"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 glass-panel rounded-xl p-1.5 shadow-xl border border-slate-800 z-50"
        >
          {locales.map((target) => {
            const active = target === locale;
            return (
              <button
                key={target}
                type="button"
                role="menuitem"
                aria-label={`Switch language to ${target}`}
                onClick={() => switchLanguage(target)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'text-indigo-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{languageLabels[target] ?? target}</span>
                {active && (
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}