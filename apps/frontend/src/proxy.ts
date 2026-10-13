import { NextRequest, NextResponse } from 'next/server';

// Must stay in sync with src/lib/i18n.ts
const locales = ['en', 'fr'];
const defaultLocale = 'fr';
const LOCALE_COOKIE = 'NEXT_LOCALE';

function getLocale(request: NextRequest): string {
  // 1) Explicit user choice stored in a cookie wins
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && locales.includes(cookie)) {
    return cookie;
  }

  // 2) Fall back to the browser's preferred language
  const acceptLanguage = request.headers.get('accept-language') || '';
  for (const part of acceptLanguage.split(',')) {
    const lang = part.trim().split(';')[0].trim().split('-')[0].toLowerCase();
    if (lang && locales.includes(lang)) {
      return lang;
    }
  }

  // 3) Finally fall back to the default locale (French)
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};