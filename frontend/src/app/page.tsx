'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/products');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center space-y-8 py-12">
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        <span>Next.js 15 & NestJS E-Commerce Platform</span>
      </div>

      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          Experience the Next Generation of{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            E-Commerce
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Full-stack shopping experience powered by NestJS REST API and Next.js App Router.
          Secure authentication, real-time inventory tracking, simple cart, and order history.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm pt-4">
        <Link
          href="/products"
          className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
        >
          <span>Explore Catalog</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <Link
          href="/login"
          className="btn-secondary w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-center"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
