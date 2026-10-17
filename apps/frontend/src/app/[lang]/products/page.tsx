'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { addToCartSchema } from '@/lib/schemas';

const PRODUCTS_PER_PAGE = 12;

interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, localePath } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    // Product list is public — fetch regardless of auth state
    if (!authLoading) {
      fetchProducts(1);
    }
  }, [authLoading]);

  const fetchProducts = async (page: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<PaginatedProducts>(
        `/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`,
      );
      setProducts(data.data || []);
      setMeta(data.meta || null);
    } catch (err: any) {
      setError(err.message || t('products.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      router.push(localePath('/login'));
      return;
    }
    const parsed = addToCartSchema.safeParse({
      productId: product.id,
      quantity: 1,
    });
    if (!parsed.success) {
      setError(t('validation.quantity'));
      return;
    }
    const { quantity } = parsed.data;
    setAddingId(product.id);
    setError('');
    try {
      await apiFetch('/cart/add', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });

      setToastMessage(t('products.addedToCart', { quantity, name: product.name }));
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || t('products.addFailed'));
    } finally {
      setAddingId(null);
    }
  };

  const goToPage = (page: number) => {
    if (!meta) return;
    if (page < 1 || page > meta.totalPages) return;
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-8 p-6 sm:p-8">
        {/* Header skeleton */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border-l-4 border-[var(--accent)] space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="skeleton-text-lg w-3/4 mb-2"></div>
            <div className="skeleton-text w-1/2"></div>
          </div>
          <div className="skeleton-btn w-32 self-start sm:self-auto"></div>
        </div>

        {/* Product grid skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-slate-800/60"
            >
              <div className="skeleton-img mb-4"></div>
              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <div className="skeleton-text w-1/3"></div>
                  <div className="skeleton-text w-1/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton-text w-3/4"></div>
                  <div className="skeleton-text w-1/2"></div>
                </div>
                <div className="skeleton-btn w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header — left aligned, asymmetric per variance > 4 */}
      <div className="glass-panel rounded-2xl border-l-4 border-[var(--accent)] p-6 sm:p-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            {t('products.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[65ch]">
            {t('products.subtitle')}
          </p>
        </div>
        <button
          onClick={() => fetchProducts(meta?.page ?? 1)}
          className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{t('products.refresh')}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-[#c0843e]/10 border border-[#c0843e]/30 text-[#e2b98a] p-4 rounded-lg text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-[#c0843e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => router.push(localePath('/cart'))}
            className="text-[#c0843e] hover:text-[#a16207] font-semibold px-3 py-1 rounded-lg text-xs transition-colors underline"
          >
            {t('products.viewCart')}
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm animate-fade-in flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid — 4 cols desktop, collapses to single column mobile */}
      {products.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
          <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-bold text-[var(--text-main)]">{t('products.noProducts')}</h3>
          <p className="text-sm text-[var(--text-muted)]">{t('products.noProductsHint')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-slate-800/60"
                >
                  <LinkProductCard
                    product={product}
                    t={t}
                    localePath={localePath}
                  />
                  <div className="space-y-3 pt-4 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[var(--text-muted)] bg-slate-800/50 px-2 py-1 rounded">
                        ID #{product.id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isOutOfStock
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : product.stock < 5
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-[#c0843e]/20 text-[#c0843e] border border-[#c0843e]/30'}`}
                      >
                        {isOutOfStock ? t('products.outOfStock') : t('products.stock', { count: product.stock })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight group-hover:text-[#c0843e] transition-colors cursor-pointer">
                        {product.name}
                      </h2>
                      <p className="text-2xl font-black text-[#c0843e]">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || addingId === product.id}
                      className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {addingId === product.id ? (
                        <span className="animate-pulse-soft">{t('products.addingToCart')}</span>
                      ) : isOutOfStock ? (
                        <span>{t('products.unavailable')}</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                          </svg>
                          <span>{t('products.addToCart')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-800/40">
              <div className="text-sm text-[var(--text-muted)]">
                {t('products.pagination.showing', {
                  from: (meta.page - 1) * meta.limit + 1,
                  to: Math.min(meta.page * meta.limit, meta.total),
                  total: meta.total,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(meta.page - 1)}
                  disabled={meta.page === 1}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="ml-1 hidden sm:inline">{t('products.pagination.prev')}</span>
                </button>
                <span className="px-2 text-sm font-bold text-[var(--text-main)]">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => goToPage(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="mr-1 hidden sm:inline">{t('products.pagination.next')}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LinkProductCard({ product, t, localePath }: { product: Product; t: any; localePath: any }) {
  return (
    <a
      href={localePath(`/products/${product.id}`)}
      className="block"
    >
      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800 flex items-center justify-center">
        <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L12 14m0-2l4.586-4.586a2 2 0 012.828 0L20 12m-6-5.586L9 16.586 6.414 14m0 0l4.586-4.586A2 2 0 1110.586 10L14 11.414m0 0l4.586-4.586a2 2 0 012.828 0L22 10m-6-5.586L9 4.586 6.414 2M2 22l6-6m6 6l6-6m6 6l6-6" />
        </svg>
      </div>
    </a>
  );
}
