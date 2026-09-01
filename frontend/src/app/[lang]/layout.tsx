import type { Metadata } from 'next';
import '../globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { I18nProvider } from '@/context/I18nContext';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { getDictionary, hasLocale } from './dictionaries';

export const metadata: Metadata = {
  title: 'ApexStore | Next-Gen E-Commerce Platform',
  description: 'High performance e-commerce platform built with Next.js & NestJS',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : defaultLocale) as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <I18nProvider locale={locale} dictionary={dictionary}>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">{children}</main>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}