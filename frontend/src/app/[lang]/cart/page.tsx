'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cart } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, localePath } = useI18n();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(localePath('/login'));
        return;
      }
      fetchCart();
    }
  }, [user, authLoading, router, localePath]);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Cart>('/cart');
      setCart(data);
    } catch (err: any) {
      setError(err.message || t('cart.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    setError('');
    try {
      await apiFetch(`/cart/item/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty }),
      });
      await fetchCart();
    } catch (err: any) {
      setError(err.message || t('cart.updateFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdatingId(itemId);
    setError('');
    try {
      await apiFetch(`/cart/item/${itemId}`, {
        method: 'DELETE',
      });
      await fetchCart();
    } catch (err: any) {
      setError(err.message || t('cart.removeFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !cart.items || cart.items.length === 0) return;

    setPlacingOrder(true);
    setError('');
    try {
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ items: orderItems }),
      });

      // REQUIREMENT: Navigate to past orders page after placing order
      router.push(localePath('/orders'));
    } catch (err: any) {
      setError(err.message || t('cart.placeOrderFailed'));
      setPlacingOrder(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">{t('cart.loading')}</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('cart.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('cart.subtitle')}</p>
        </div>
        <Link
          href={localePath('/products')}
          className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold self-start md:self-auto flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t('cart.continueShopping')}</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center space-x-3 animate-fade-in">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">{t('cart.emptyTitle')}</h3>
          <p className="text-sm text-slate-400">{t('cart.emptyHint')}</p>
          <div className="pt-2">
            <Link href={localePath('/products')} className="btn-primary inline-flex px-6 py-2.5 rounded-xl text-sm font-semibold">
              {t('cart.browseCatalog')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      #{product?.id || item.productId}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{product?.name || t('cart.product')}</h3>
                      <p className="text-sm text-indigo-400 font-semibold mt-0.5">
                        ${(product?.price || 0).toFixed(2)} {t('cart.each')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="btn-secondary w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating || (product && item.quantity >= product.stock)}
                        className="btn-secondary w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{t('cart.subtotal')}</p>
                      <p className="text-base font-bold text-white">
                        ${((product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title={t('cart.remove')}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
{t('cart.summary')}
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>{t('cart.totalItems')}</span>
                <span className="font-semibold text-slate-200">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t('cart.shippingFee')}</span>
                <span className="font-semibold text-emerald-400">{t('cart.free')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t('cart.estimatedTax')}</span>
                <span className="font-semibold text-slate-200">$0.00</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between text-lg font-bold text-white">
                <span>{t('cart.grandTotal')}</span>
                <span className="text-indigo-400">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || items.length === 0}
              className="btn-primary w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center space-x-2"
            >
              {placingOrder ? (
                <span>{t('cart.processingOrder')}</span>
              ) : (
                <>
                  <span>{t('cart.placeOrder')}</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
