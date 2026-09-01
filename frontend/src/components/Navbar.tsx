'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { t, localePath } = useI18n();

  const handleLogout = () => {
    logout();
    router.push(localePath('/login'));
  };

  const isActive = (path: string) => pathname === localePath(path);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={localePath('/products')} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ApexStore
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href={localePath('/products')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/products')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {t('nav.products')}
          </Link>

          {user && (
            <>
              <Link
                href={localePath('/cart')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive('/cart')
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{t('nav.cart')}</span>
                {cartCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href={localePath('/orders')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/orders')
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t('nav.orders')}
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              href={localePath('/admin/products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/admin/products')
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{t('nav.adminPanel')}</span>
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-400">{user.email}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href={localePath('/login')}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href={localePath('/register')}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
