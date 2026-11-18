'use client';

import React, { useState, useEffect } from 'react';
import { CartItem, Transaction } from '@/types';
import { formatRupiah } from '@/lib/format';
import ProductIcon from '@/components/ProductIcon';
import { ShoppingBag, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalQty, setTotalQty] = useState<number>(0);
  const [lastItem, setLastItem] = useState<CartItem | null>(null);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock in WIB
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('id-ID') +
          ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('pos_display_channel');
    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'CART_UPDATE') {
        setCart(data.cart || []);
        setTotalAmount(data.totalAmount || 0);
        setTotalQty(data.totalQty || 0);
        setLastItem(data.lastItem || null);
        if (data.cart && data.cart.length > 0) {
          setCompletedTx(null); // dismiss thank you screen if new items are being added
        }
      } else if (data.type === 'TRANSACTION_SUCCESS') {
        setCompletedTx(data.transaction);
        setCart([]);
        setTotalAmount(0);
        setTotalQty(0);
        setLastItem(null);
      } else if (data.type === 'RESET') {
        setCart([]);
        setTotalAmount(0);
        setTotalQty(0);
        setLastItem(null);
        setCompletedTx(null);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col select-none">
      <header className="border-b border-slate-800 bg-[#0f172a] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
            MK
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">Minimarket Kita</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Layar Pelanggan</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-mono">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{currentTime || 'Memuat waktu...'}</span>
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col justify-between">
        {completedTx ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mb-6 shadow-xl">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <h2 className="text-4xl font-black text-white tracking-tight">
              Terima Kasih
            </h2>
            <p className="text-slate-400 text-base mt-2 max-w-md">
              Transaksi berhasil. Selamat menikmati belanjaan Anda.
            </p>

            <div className="mt-8 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-3 font-mono text-sm">
              <div className="flex justify-between text-slate-400">
                <span>No. Nota:</span>
                <span className="font-bold text-white">{completedTx.invoice_no}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total:</span>
                <span className="font-extrabold text-blue-400 text-lg">
                  {formatRupiah(completedTx.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Metode:</span>
                <span className="font-bold text-white uppercase">{completedTx.payment_method}</span>
              </div>
              {completedTx.payment_method === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Tunai:</span>
                    <span className="font-bold text-white">
                      {formatRupiah(completedTx.cash_received)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-2 border-t border-slate-700 font-bold text-base">
                    <span>Kembalian:</span>
                    <span className="text-xl font-extrabold">
                      {formatRupiah(completedTx.change_amount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <div className="w-24 h-24 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-inner">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg">
              Silakan letakkan belanjaan Anda di meja kasir.
            </p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col space-y-6">
              {lastItem && (
                <div className="bg-blue-600/20 border-2 border-blue-500 rounded-3xl p-6 flex items-center gap-5 shadow-lg">
                  <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center flex-shrink-0 shadow-md">
                    <ProductIcon
                      name={lastItem.product.name}
                      category={lastItem.product.category}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Item Baru</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white truncate mt-0.5">
                      {lastItem.product.name}
                    </h3>
                    <p className="text-sm font-semibold text-slate-300">
                      {lastItem.quantity} x {formatRupiah(lastItem.product.selling_price)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-black text-white font-mono">
                      {formatRupiah(lastItem.product.selling_price * lastItem.quantity)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Daftar Belanja
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {cart.length} Item ({totalQty} Pcs)
                  </span>
                </div>

                <div className="py-3 flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0">
                          <ProductIcon
                            name={item.product.name}
                            category={item.product.category}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {item.quantity} x {formatRupiah(item.product.selling_price)}
                          </p>
                        </div>
                      </div>
                      <div className="font-mono font-extrabold text-white text-sm sm:text-base ml-4">
                        {formatRupiah(item.product.selling_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-600/50 rounded-3xl p-8 shadow-2xl">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                  Ringkasan Belanja
                </span>
                <h3 className="text-xl font-bold text-slate-200 mt-1">Total Tagihan</h3>
              </div>

              <div className="my-10 text-center py-8 bg-slate-950/70 rounded-3xl border border-slate-800 shadow-inner">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Total
                </span>
                <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight leading-none px-4">
                  {formatRupiah(totalAmount)}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-3">
                  Harga sudah termasuk PPN
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  <span className="text-xs text-slate-400 font-semibold block">Total Kuantitas</span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    {totalQty} Pcs
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  <span className="text-xs text-slate-400 font-semibold block">Jenis Produk</span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    {cart.length} SKU
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0f172a] px-8 py-3 flex items-center justify-between text-xs text-slate-400">
        <div>
          Layanan Pelanggan: <span className="text-slate-200 font-mono">0812-3456-7890</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Terhubung ke kasir</span>
        </div>
      </footer>
    </div>
  );
}
