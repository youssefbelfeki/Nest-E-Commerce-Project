'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { loginSchema, toFieldErrors } from '@/lib/schemas';
import { FieldError } from '@/components/FieldError';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { t, localePath } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.push(localePath('/products'));
    } catch (err: any) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-panel rounded-2xl border-l-4 border-[var(--accent)] p-8 space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
            {t('login.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              {t('login.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              placeholder={t('login.emailPlaceholder')}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
            <FieldError id="login-email-error" message={fieldErrors.email} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              {t('login.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              placeholder="••••••••"
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            <FieldError id="login-password-error" message={fieldErrors.password} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span className="animate-pulse-soft">{t('login.signingIn')}</span>
            ) : (
              <>
                <span>{t('login.signIn')}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="text-sm text-[var(--text-muted)] pt-2 border-t border-slate-800">
          {t('login.noAccount')}{' '}
          <Link
            href={localePath('/register')}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold underline"
          >
            {t('login.registerNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
