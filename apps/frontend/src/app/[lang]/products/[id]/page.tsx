'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { addToCartSchema } from '@/lib/schemas';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, localePath } = useI18n();

  // Resolve product id from params (always called, same order every render)
  const [productId, setProductId] = useState<number | null>(null);
  useEffect(() => {
    params.then((p) => setProductId(Number(p.id)));
  }, [params]);

  // All remaining hooks must be called unconditionally, same order every render
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    // Product detail is public — fetch regardless of auth state
    if (!authLoading) {
      if (!productId || !Number.isInteger(productId) || productId < 1) {
        setError(t('products.detail.invalidId'));
        setLoading(false);
        return;
      }
      fetchProduct();
    }
  }, [authLoading, productId, t]);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Product>(`/products/${productId}`);
      setProduct(data || null);
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || t('products.detail.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const newQty = Math.max(1, Math.min(product.stock, quantity + delta));
    setQuantity(newQty);
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    const parsed = parseInt(e.target.value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(parsed, product.stock));
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push(localePath('/login'));
      return;
    }
    if (!product) return;
    if (product.stock < 1) {
      setError(t('products.detail.productOutOfStock'));
      return;
    }

    const parsed = addToCartSchema.safeParse({
      productId: product.id,
      quantity,
    });
    if (!parsed.success) {
      setError(t('products.detail.invalidQty'));
      return;
    }

    setAdding(true);
    setError('');
    try {
      await apiFetch('/cart/add', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      router.push(localePath('/cart'));
    } catch (err: any) {
      setError(err.message || t('products.addFailed'));
    } finally {
      setAdding(false);
    }
  };

  // Conditional rendering AFTER all hooks
  if (productId === null) {
    return (
      <div className="space-y-8 p-6 sm:p-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border-l-4 border-[var(--accent)] space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="skeleton-text-lg w-3/4 mb-2"></div>
            <div className="skeleton-text w-1/2"></div>
          </div>
          <div className="skeleton-btn w-32 self-start sm:self-auto"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="skeleton-img"></div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="skeleton-text w-1/3"></div>
                <div className="skeleton-text w-1/4"></div>
              </div>
              <div className="space-y-2">
                <div className="skeleton-text-lg w-2/3"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="skeleton-text w-1/4"></div>
              <div className="flex items-center space-x-2">
                <div className="skeleton-btn w-10 h-10"></div>
                <div className="skeleton w-20 h-10"></div>
                <div className="skeleton-btn w-10 h-10"></div>
              </div>
            </div>
            <div className="skeleton-btn w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="space-y-8 p-6 sm:p-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border-l-4 border-[var(--accent)] space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="skeleton-text-lg w-3/4 mb-2"></div>
            <div className="skeleton-text w-1/2"></div>
          </div>
          <div className="skeleton-btn w-32 self-start sm:self-auto"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="skeleton-img"></div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="skeleton-text w-1/3"></div>
                <div className="skeleton-text w-1/4"></div>
              </div>
              <div className="space-y-2">
                <div className="skeleton-text-lg w-2/3"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="skeleton-text w-1/4"></div>
              <div className="flex items-center space-x-2">
                <div className="skeleton-btn w-10 h-10"></div>
                <div className="skeleton w-20 h-10"></div>
                <div className="skeleton-btn w-10 h-10"></div>
              </div>
            </div>
            <div className="skeleton-btn w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border-l-4 border-[var(--accent)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            {product.name}
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[65ch]">
            {`${t('products.detail.stock')} ${product.stock} ${isOutOfStock ? '— ' + t('products.detail.outOfStock') : 'available'}`}
          </p>
        </div>
        <button
          onClick={() => router.push(localePath('/products'))}
          className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t('products.detail.backToProducts')}</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm animate-fade-in flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800 flex items-center justify-center">
          <svg className="w-24 h-24 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L12 14m0-2l4.586-4.586a2 2 0 012.828 0L20 12m-6-5.586L9 16.586 6.414 14m0 0l4.586-4.586A2 2 0 1110.586 10L14 11.414m0 0l4.586-4.586a2 2 0 012.828 0L22 10m-6-5.586L9 4.586 6.414 2M2 22l6-6m6 6l6-6m6 6l6-6" />
          </svg>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] bg-slate-800/50 px-2 py-1 rounded">
                {t('products.detail.id')} {product.id}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isOutOfStock
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : product.stock < 5
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#c0843e]/20 text-[#c0843e] border border-[#c0843e]/30'}`}
              >
                {isOutOfStock ? t('products.detail.outOfStock') : `Stock: ${product.stock}`}
              </span>
            </div>

            <p className="text-3xl font-black text-[#c0843e]">
              ${product.price.toFixed(2)}
            </p>
          </div>

          {/* Quantity Selector — qty input lives here on the detail page */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
              {t('products.detail.quantity')}
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || isOutOfStock || adding}
                className="btn-secondary w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={isOutOfStock ? 0 : product.stock}
                value={quantity}
                onChange={handleQuantityInput}
                disabled={isOutOfStock || adding}
                className="input-field w-20 text-center py-2 text-sm font-semibold disabled:opacity-50"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock || isOutOfStock || adding}
                className="btn-secondary w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className="btn-primary w-full py-3.5 rounded-lg text-base font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {adding ? (
              <span className="animate-pulse-soft">{t('products.detail.addingToCart')}</span>
            ) : isOutOfStock ? (
              <span>{t('products.detail.outOfStock')}</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span>{t('products.detail.addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
