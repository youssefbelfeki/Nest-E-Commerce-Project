'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createStock, setCreateStock] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/products');
        return;
      }
      fetchProducts();
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceNum = parseFloat(createPrice);
    const stockNum = parseInt(createStock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock must be a non-negative integer');
      return;
    }

    setCreating(true);
    try {
      const newProduct = await apiFetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: createName,
          price: priceNum,
          stock: stockNum,
        }),
      });

      setProducts((prev) => [...prev, newProduct]);
      setSuccess(`Successfully created product "${newProduct.name}"!`);
      setCreateName('');
      setCreatePrice('');
      setCreateStock('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateProduct = async (id: number) => {
    setError('');
    setSuccess('');

    const priceNum = parseFloat(editPrice);
    const stockNum = parseInt(editStock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock must be a non-negative integer');
      return;
    }

    setUpdating(true);
    try {
      const updated = await apiFetch<Product>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          price: priceNum,
          stock: stockNum,
        }),
      });

      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSuccess(`Updated product "${updated.name}"`);
      setEditingId(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/products/${id}`, {
        method: 'DELETE',
      });

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Verifying admin access & loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border-l-4 border-l-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge-admin px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
              Admin Restricted
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Product Management</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Create, update, or remove items from the catalog inventory
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold self-start md:self-auto flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Inventory</span>
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-sm flex items-center space-x-3 animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center space-x-3 animate-fade-in">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Add New Product Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Product</span>
        </h2>

        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g. Wireless Mechanical Keyboard"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Price ($ USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              className="input-field w-full"
              placeholder="99.99"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Initial Stock Qty
            </label>
            <input
              type="number"
              min="0"
              required
              value={createStock}
              onChange={(e) => setCreateStock(e.target.value)}
              className="input-field w-full"
              placeholder="50"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2"
            >
              {creating ? (
                <span>Adding Product...</span>
              ) : (
                <>
                  <span>Create Product</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Catalog Inventory ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No products found in inventory. Add your first item above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Product Name</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Stock</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((product) => {
                  const isEditing = editingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-500">#{product.id}</td>

                      <td className="py-4 px-6 font-medium text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-field py-1 px-2 text-sm w-full"
                          />
                        ) : (
                          product.name
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-indigo-400">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="input-field py-1 px-2 text-sm w-28"
                          />
                        ) : (
                          `$${product.price.toFixed(2)}`
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="input-field py-1 px-2 text-sm w-24"
                          />
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              product.stock <= 0
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : product.stock < 5
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {product.stock} units
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdateProduct(product.id)}
                              disabled={updating}
                              className="btn-primary px-3 py-1 rounded-lg text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="btn-secondary px-3 py-1 rounded-lg text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(product)}
                              className="btn-secondary px-3 py-1 rounded-lg text-xs font-semibold hover:border-indigo-500/40 hover:text-indigo-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              className="btn-danger px-3 py-1 rounded-lg text-xs font-semibold"
                            >
                              {deletingId === product.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
