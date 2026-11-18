'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/format';
import ProductIcon from '@/components/ProductIcon';
import { X, Save, Sparkles, Loader2, Package, Tag, Layers, DollarSign, Archive } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Sembako',
  'Makanan Instan',
  'Minuman',
  'Kebersihan',
  'Snack & Biskuit',
  'Bumbu Dapur',
  'Perawatan Diri',
  'Lainnya',
];

const ICON_PRESETS = [
  { label: 'Beras', val: 'beras' },
  { label: 'Minyak', val: 'minyak' },
  { label: 'Gula', val: 'gula' },
  { label: 'Telur', val: 'telur' },
  { label: 'Mie Instan', val: 'indomie' },
  { label: 'Kopi', val: 'kopi' },
  { label: 'Teh Botol', val: 'teh' },
  { label: 'Susu', val: 'susu' },
  { label: 'Sabun Cuci', val: 'sabun cuci' },
  { label: 'Sabun Mandi', val: 'mandi' },
  { label: 'Deterjen', val: 'deterjen' },
  { label: 'Air Mineral', val: 'air' },
];

export default function ProductFormModal({ isOpen, product, onClose, onSuccess }: ProductFormModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('beras');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setCategory(product.category);
      setCostPrice(product.cost_price.toString());
      setSellingPrice(product.selling_price.toString());
      setStock(product.stock.toString());
      setSelectedIcon(product.name.toLowerCase());
    } else {
      // Generate default SKU
      const randNum = Math.floor(100 + Math.random() * 900);
      setSku(`BRG-${randNum}`);
      setName('');
      setCategory(CATEGORIES[0]);
      setCostPrice('');
      setSellingPrice('');
      setStock('10');
      setSelectedIcon('beras');
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const profitMargin = sell > cost && cost > 0 ? Math.round(((sell - cost) / cost) * 100) : 0;
  const nominalProfit = Math.max(0, sell - cost);

  const handleGenerateSku = () => {
    const randNum = Math.floor(100 + Math.random() * 900);
    setSku(`BRG-${randNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sku.trim() || !name.trim() || !costPrice || !sellingPrice || stock === '') {
      setError('Harap isi semua kolom wajib.');
      return;
    }

    if (cost < 0 || sell < 0 || parseInt(stock, 10) < 0) {
      setError('Harga dan kuantitas stok tidak boleh bernilai negatif.');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          name: name.trim(),
          category: category.trim(),
          cost_price: cost,
          selling_price: sell,
          stock: parseInt(stock, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan barang');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {product ? 'Edit Barang' : 'Tambah Barang'}
              </h2>
              <p className="text-xs text-slate-500">
                {product ? 'Perbarui data barang dan stok' : 'Tambah produk baru ke katalog toko'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Kode SKU / Barcode *</label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 min-h-[32px] px-2"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto SKU
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BRG-001"
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Barang *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSelectedIcon(e.target.value.toLowerCase());
              }}
              placeholder="Contoh: Roti Tawar Gandum Sari Roti"
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ikon Produk:
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ProductIcon name={name || selectedIcon} className="w-12 h-12 object-contain" />
              </div>
              <div className="flex-1 overflow-x-auto min-w-0">
                <div className="flex items-center gap-1.5 pb-1">
                  {ICON_PRESETS.map((ic) => (
                    <button
                      key={ic.val}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(ic.val);
                        if (!name) setName(ic.label);
                      }}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 whitespace-nowrap"
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Harga Modal *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stok *</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:bg-white"
                required
              />
            </div>
          </div>

          {sell > 0 && cost > 0 && (
            sell < cost ? (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-300 flex items-center justify-between text-xs text-rose-700">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  Peringatan: harga jual lebih rendah dari modal
                </span>
                <div className="font-extrabold font-mono text-rose-700">
                  Rugi: -{formatRupiah(cost - sell)}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Estimasi laba per pcs:</span>
                <div className="font-bold text-emerald-700 font-mono">
                  +{formatRupiah(nominalProfit)} ({profitMargin > 0 ? `+${profitMargin}%` : '0%'})
                </div>
              </div>
            )
          )}

          <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
