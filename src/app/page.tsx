'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, CartItem, Transaction } from '@/types';
import { formatRupiah } from '@/lib/format';
import ProductIcon from '@/components/ProductIcon';
import ReceiptModal from '@/components/ReceiptModal';
import ProductFormModal from '@/components/ProductFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  QrCode,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle,
  ShoppingBag,
  Loader2,
  Banknote,
  Search,
  AlertCircle,
  PackagePlus,
} from 'lucide-react';

export default function CashierPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Cart totals calculated early
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  }, [cart]);

  const totalQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

  // Initialize BroadcastChannel for secondary Customer Display (/display)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastRef.current = new BroadcastChannel('pos_display_channel');
    }
    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  useEffect(() => {
    fetchProducts();

    // Listen to search filter events from top navbar
    const onSearchEvent = (e: any) => {
      setSearch(e.detail || '');
    };
    window.addEventListener('pos-search', onSearchEvent);

    return () => {
      window.removeEventListener('pos-search', onSearchEvent);
    };
  }, []);

  // Barcode / SKU Scan listener with multiplier support (e.g., "3*BRG-001" or "BRG-001")
  useEffect(() => {
    const onScanSubmit = (e: any) => {
      const input = (e.detail || '').trim();
      if (!input) return;

      // Check multiplier format: "3*BRG-001" or "2*8991234"
      let qty = 1;
      let code = input;
      const multMatch = input.match(/^(\d+)\*(.+)$/);
      if (multMatch) {
        qty = parseInt(multMatch[1], 10) || 1;
        code = multMatch[2].trim();
      }

      // Search matching product by exact SKU or name
      const target = products.find(
        (p) =>
          p.sku.toLowerCase() === code.toLowerCase() ||
          p.name.toLowerCase() === code.toLowerCase()
      );

      if (target) {
        if (target.stock <= 0) {
          showToast(`Stok "${target.name}" sudah habis!`, 'error');
          return;
        }

        // Add to cart with scanned multiplier qty
        setCart((prev) => {
          const idx = prev.findIndex((item) => item.product.id === target.id);
          if (idx > -1) {
            const currentItem = prev[idx];
            const nextQty = currentItem.quantity + qty;
            if (nextQty > target.stock) {
              showToast(`Maksimal stok tercapai untuk "${target.name}" (${target.stock} pcs)`, 'error');
              return prev;
            }
            const updated = [...prev];
            updated[idx] = { ...currentItem, quantity: nextQty };
            return updated;
          }
          const addQty = Math.min(qty, target.stock);
          return [...prev, { product: target, quantity: addQty }];
        });

        showToast(`+${qty}x ${target.name} ditambahkan ke keranjang`, 'success');
        // Clear search input in navbar
        window.dispatchEvent(new CustomEvent('pos-scan-clear'));
      } else {
        // Not exact code match: leave query for text filtering and notify
        showToast(`Barang dengan kode/nama "${code}" tidak ditemukan!`, 'error');
      }
    };

    window.addEventListener('pos-scan-submit', onScanSubmit);
    return () => window.removeEventListener('pos-scan-submit', onScanSubmit);
  }, [products]);

  // Global POS Keyboard Shortcuts (F9: Bayar Tunai, F10: Bayar QRIS, Esc: Tutup Modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentMethod('CASH');
        setCashAmount(totalAmount.toString());
      } else if (e.key === 'F10') {
        e.preventDefault();
        setPaymentMethod('QRIS');
        if (totalAmount > 0) {
          setQrisModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        setQrisModalOpen(false);
        setIsAddProductOpen(false);
        setReceiptTx(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalAmount]);

  // Category list
  const categories = useMemo(() => {
    const defaultCats = ['Semua', 'Sembako', 'Makanan Instan', 'Minuman', 'Kebersihan'];
    const dynamicCats = new Set<string>();
    products.forEach((p) => {
      if (!defaultCats.includes(p.category)) dynamicCats.add(p.category);
    });
    return [...defaultCats, ...Array.from(dynamicCats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  // Broadcast cart updates to Customer Display
  useEffect(() => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'CART_UPDATE',
        cart,
        totalAmount,
        totalQty,
        lastItem: cart[cart.length - 1] || null,
      });
    }
  }, [cart, totalAmount, totalQty]);

  const numericCash = parseFloat(cashAmount) || totalAmount;
  const changeAmount = Math.max(0, numericCash - totalAmount);

  // Quick cash amounts matching reference
  const quickCashOptions = useMemo(() => {
    const list = [totalAmount];
    if (totalAmount < 50000) list.push(50000);
    if (totalAmount < 100000) list.push(100000);
    list.push(150000, 200000);
    return Array.from(new Set(list.filter((v) => v >= totalAmount && v > 0)));
  }, [totalAmount]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok "${product.name}" habis!`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const item = prev[idx];
        if (item.quantity >= product.stock) {
          alert(`Maksimal stok tercapai (${product.stock})`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...item, quantity: item.quantity + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              alert(`Maksimal stok tersedia (${item.product.stock})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    if (paymentMethod === 'CASH' && numericCash < totalAmount) {
      alert('Nominal uang tunai kurang dari total belanja!');
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        cashier_name: currentUser?.name || 'Kasir',
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'CASH' ? numericCash : totalAmount,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses transaksi');
      }

      setReceiptTx(data);
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({
          type: 'TRANSACTION_SUCCESS',
          transaction: data,
        });
      }
      setCart([]);
      setCashAmount('');
      setQrisModalOpen(false);
      showToast(`Transaksi ${data.invoice_no} Berhasil!`, 'success');
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 relative">
      {/* Dynamic Toast Feedback Banner */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold transition-all animate-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shadow-xs active:scale-[0.98] min-h-[40px] ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-[0.98] flex-shrink-0 min-h-[40px]"
            title="Tambah Barang Baru ke Inventaris"
          >
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <span>+ Tambah Barang</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 sm:h-64 bg-white rounded-3xl animate-pulse border border-slate-200/80 p-4 sm:p-5" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci pencarian atau kategori lainnya.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock < 5;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 flex flex-col justify-between transition-all duration-150 cursor-pointer relative group active:scale-[0.98] ${
                    isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex justify-end">
                    {isOutOfStock ? (
                      <span className="bg-rose-500 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xs">
                        Habis
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-[#f87171] text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-xs">
                        Stok {product.stock}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        Stok {product.stock}
                      </span>
                    )}
                  </div>

                  <div className="my-1 sm:my-2 flex items-center justify-center h-20 sm:h-28">
                    <ProductIcon
                      name={product.name}
                      category={product.category}
                      className="w-16 h-16 sm:w-24 sm:h-24 object-contain transition-transform group-hover:scale-105"
                    />
                  </div>

                  <div className="pt-1 sm:pt-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-sm sm:text-lg font-black text-slate-950 mt-0.5 sm:mt-1 tracking-tight">
                      {formatRupiah(product.selling_price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div id="mobile-cart-panel" className="w-full lg:w-[380px] flex-shrink-0">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between min-h-[480px] lg:min-h-[640px] lg:sticky lg:top-24">
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Keranjang</h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors py-1 px-2"
                >
                  Kosongkan
                </button>
              )}
            </div>

            <div className="py-3 sm:py-4 space-y-2.5 sm:space-y-3 max-h-[300px] sm:max-h-[320px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-slate-400">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Keranjang Masih Kosong</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pilih produk di katalog untuk ditambahkan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-150/80 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <ProductIcon
                          name={item.product.name}
                          category={item.product.category}
                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h5>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {formatRupiah(item.product.selling_price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold rounded-lg hover:bg-slate-100"
                        title="Kurangi Kuantitas"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-30"
                        title="Tambah Kuantitas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-slate-150 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod(paymentMethod === 'QRIS' ? 'CASH' : 'QRIS');
                  if (paymentMethod !== 'QRIS' && totalAmount > 0) {
                    setQrisModalOpen(true);
                  }
                }}
                className={`p-2.5 min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
                title="Metode QRIS"
              >
                <QrCode className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 flex-1 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setCashAmount(totalAmount.toString());
                  }}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    numericCash === totalAmount && paymentMethod === 'CASH'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  Uang Pas
                </button>
                {quickCashOptions.slice(1, 3).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setCashAmount(amt.toString());
                    }}
                    className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      numericCash === amt && paymentMethod === 'CASH'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-lg sm:text-xl font-bold text-slate-900">Total</span>
              <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className="w-full py-3.5 sm:py-4 min-h-[48px] rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses Transaksi...</span>
                </>
              ) : (
                <span>Bayar &amp; Cetak Struk</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-slate-400 font-semibold block">{totalQty} item di keranjang</span>
            <span className="text-sm font-black text-white truncate block">{formatRupiah(totalAmount)}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('mobile-cart-panel')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-95 flex items-center gap-1.5 flex-shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Lihat Keranjang</span>
          </button>
        </div>
      )}

      {qrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">QRIS Dinamis</h3>
              <button onClick={() => setQrisModalOpen(false)} className="text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center p-2">
              <div className="text-[10px] font-black text-slate-800 tracking-wider">
                QRIS STANDAR PEMBAYARAN NASIONAL
              </div>
              <svg className="w-44 h-44 sm:w-48 sm:h-48 mx-auto my-2" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="26" height="26" rx="2" fill="black" />
                <rect x="9" y="9" width="18" height="18" rx="1" fill="white" />
                <rect x="13" y="13" width="10" height="10" rx="1" fill="black" />
                <rect x="69" y="5" width="26" height="26" rx="2" fill="black" />
                <rect x="73" y="9" width="18" height="18" rx="1" fill="white" />
                <rect x="77" y="13" width="10" height="10" rx="1" fill="black" />
                <rect x="5" y="69" width="26" height="26" rx="2" fill="black" />
                <rect x="9" y="73" width="18" height="18" rx="1" fill="white" />
                <rect x="13" y="77" width="10" height="10" rx="1" fill="black" />
                <rect x="36" y="8" width="6" height="6" fill="black" />
                <rect x="46" y="8" width="6" height="6" fill="black" />
                <rect x="56" y="8" width="6" height="6" fill="black" />
                <rect x="34" y="36" width="8" height="8" fill="black" />
                <rect x="46" y="36" width="8" height="8" fill="black" />
                <rect x="58" y="36" width="8" height="8" fill="black" />
                <rect x="70" y="66" width="22" height="6" fill="black" />
                <rect x="70" y="88" width="22" height="6" fill="black" />
              </svg>
              <p className="text-xs font-bold text-slate-800">INDO POS MINIMARKET</p>
              <p className="text-base font-black text-blue-600 mt-0.5">{formatRupiah(totalAmount)}</p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCheckout}
              className="w-full py-3 min-h-[48px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Simulasikan QRIS Terbayar Lunas
            </button>
          </div>
        </div>
      )}

      <ReceiptModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />

      <ProductFormModal
        isOpen={isAddProductOpen}
        product={null}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => {
          fetchProducts();
          showToast('Barang baru berhasil ditambahkan ke inventaris', 'success');
        }}
      />
    </div>
  );
}
