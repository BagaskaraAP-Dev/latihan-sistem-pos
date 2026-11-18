'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/format';
import ProductIcon from '@/components/ProductIcon';
import ProductFormModal from '@/components/ProductFormModal';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Package,
  RefreshCw,
  Archive,
  ArrowUpDown,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const lowStockCount = useMemo(() => products.filter((p) => p.stock < 5).length, [products]);
  const totalStockCount = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus produk "${name}" dari inventaris?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus produk');
        return;
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  const handleQuickAddStock = async (p: Product, amount: number) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: p.sku,
          name: p.name,
          category: p.category,
          cost_price: p.cost_price,
          selling_price: p.selling_price,
          stock: p.stock + amount,
        }),
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Manajemen Stok Produk
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Katalog barang dagangan minimarket, sisa stok, dan harga.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            className="p-3 min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 flex items-center justify-center"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 min-h-[44px] rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Item SKU</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{products.length} SKU</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stok Fisik</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{totalStockCount} Pcs</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Stok Perlu Restock</span>
            <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{lowStockCount} Produk (&lt; 5)</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari SKU atau nama barang..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap min-h-[40px] flex items-center ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-extrabold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Barang</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Tidak ada barang yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock < 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 p-1 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <ProductIcon name={p.name} category={p.category} className="w-8 h-8 object-contain" />
                          </div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.sku}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-500">
                        {formatRupiah(p.cost_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(p.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-extrabold font-mono text-slate-900">{p.stock} pcs</span>
                          <button
                            type="button"
                            onClick={() => handleQuickAddStock(p, 5)}
                            className="px-2.5 py-1 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold border border-slate-200 flex items-center justify-center"
                            title="Tambah 5 pcs"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="px-3 py-1 rounded-full bg-[#f87171] text-white font-bold text-xs shadow-xs">
                            Stok Menipis ({p.stock})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                            Tersedia
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center"
                            title="Edit Barang"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
