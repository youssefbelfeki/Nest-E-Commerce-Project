'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, localePath } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(localePath('/login'));
      return;
    }

    if (user) {
      fetchProducts();
    }
  }, [user, authLoading, router, localePath]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data || []);
      // Initialize default quantities to 1
      const initialQty: Record<number, number> = {};
      (data || []).forEach((p) => {
        initialQty[p.id] = 1;
      });
      setQuantities(initialQty);
    } catch (err: any) {
      setError(err.message || t('products.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: number, qty: number) => {
    const product = products.find((p) => p.id === productId);
    const max = product ? product.stock : 99;
    const validQty = Math.max(1, Math.min(max, qty));
    setQuantities((prev) => ({ ...prev, [productId]: validQty }));
  };

  const handleAddToCart = async (product: Product) => {
    const quantity = quantities[product.id] || 1;
    setAddingId(product.id);
    setError('');
    try {
      await apiFetch('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      setToastMessage(t('products.addedToCart', { quantity, name: product.name }));
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || t('products.addFailed'));
    } finally {
      setAddingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">{t('products.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('products.title')}</h1>
          <p className="text-slate-400 text-sm">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={fetchProducts}
          className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{t('products.refresh')}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-sm flex items-center justify-between animate-fade-in shadow-lg shadow-emerald-500/10">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => router.push(localePath('/cart'))}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-colors"
          >
            {t('products.viewCart')}
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm animate-fade-in flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
          <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-bold text-slate-300">{t('products.noProducts')}</h3>
          <p className="text-sm text-slate-400">{t('products.noProductsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const currentQty = quantities[product.id] || 1;

            return (
              <div
                key={product.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Badge & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                      ID #{product.id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isOutOfStock
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : product.stock < 5
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOutOfStock ? t('products.outOfStock') : t('products.stock', { count: product.stock })}
                    </span>
                  </div>

                  {/* Product Title & Icon */}
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-2xl font-black text-indigo-400">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Add to Cart Actions */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-slate-400">{t('products.qty')}</label>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      disabled={isOutOfStock}
                      value={currentQty}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                      className="input-field w-20 text-center py-1 text-sm font-semibold disabled:opacity-50"
                    />
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock || addingId === product.id}
                    className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {addingId === product.id ? (
                      <span>{t('products.addingToCart')}</span>
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
      )}
    </div>
  );
}
