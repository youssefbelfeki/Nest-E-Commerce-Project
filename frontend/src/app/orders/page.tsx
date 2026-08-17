'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Order[]>('/orders');
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load past orders');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Fetching order history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Order History</h1>
          <p className="text-slate-400 text-sm mt-1">View details and status of all your placed orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold self-start md:self-auto flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Orders</span>
        </button>
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

      {orders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">No past orders found</h3>
          <p className="text-sm text-slate-400">You haven't placed any orders yet.</p>
          <div className="pt-2">
            <Link href="/products" className="btn-primary inline-flex px-6 py-2.5 rounded-xl text-sm font-semibold">
              Browse & Place First Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            const orderTotal = order.items.reduce(
              (sum, item) => sum + (item.product?.price || 0) * item.quantity,
              0
            );

            return (
              <div key={order.id} className="glass-panel rounded-2xl overflow-hidden space-y-4 p-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                      Order #{order.id}
                    </span>
                    <span className="text-xs text-slate-400">{dateStr}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Completed
                    </span>
                    <span className="text-lg font-extrabold text-white sm:ml-4">
                      Total: ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="divide-y divide-slate-800/60">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 font-mono text-xs">#{item.productId}</span>
                        <span className="font-semibold text-slate-200">{item.product?.name || 'Product'}</span>
                      </div>

                      <div className="flex items-center space-x-6">
                        <span className="text-xs text-slate-400">
                          {item.quantity} x ${(item.product?.price || 0).toFixed(2)}
                        </span>
                        <span className="font-bold text-slate-100 min-w-[70px] text-right">
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
