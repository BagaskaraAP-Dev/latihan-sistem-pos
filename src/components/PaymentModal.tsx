'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/format';
import { Banknote, QrCode, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'CASH' | 'QRIS', cashReceived?: number) => Promise<void>;
}

export default function PaymentModal({ totalAmount, isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericCash = parseFloat(cashAmount) || 0;
  const change = Math.max(0, numericCash - totalAmount);
  const isCashSufficient = numericCash >= totalAmount;

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    100000,
  ].filter((v, idx, arr) => v >= totalAmount && arr.indexOf(v) === idx);

  const handleSubmit = async () => {
    try {
      setError(null);
      if (method === 'CASH' && !isCashSufficient) {
        setError('Nominal uang tunai kurang dari total belanja.');
        return;
      }
      setIsSubmitting(true);
      await onConfirm(method, method === 'CASH' ? numericCash : totalAmount);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-semibold text-white">Pembayaran</h2>
            <p className="text-xs text-slate-400">Pilih metode pembayaran</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Tagihan:</span>
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMethod('CASH');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border text-sm font-semibold transition-all ${
                method === 'CASH'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-5 h-5" />
              Tunai
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('QRIS');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl border text-sm font-semibold transition-all ${
                method === 'QRIS'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-5 h-5" />
              QRIS
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {method === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nominal Uang Tunai:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={totalAmount}
                    placeholder="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashAmount(amt.toString())}
                    className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                  >
                    {amt === totalAmount ? 'Uang Pas' : formatRupiah(amt)}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Kembalian:</span>
                <span
                  className={`font-bold text-base ${
                    isCashSufficient ? 'text-teal-400' : 'text-slate-500'
                  }`}
                >
                  {isCashSufficient ? formatRupiah(change) : 'Nominal belum cukup'}
                </span>
              </div>
            </div>
          )}

          {method === 'QRIS' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center">
                <div className="text-[10px] font-bold tracking-widest text-slate-800 border-b pb-1 w-full text-center">
                  QRIS STANDAR PEMBAYARAN NASIONAL
                </div>
                <svg
                  className="w-48 h-48 my-2"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
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

                  <rect x="36" y="20" width="6" height="6" fill="black" />
                  <rect x="48" y="20" width="6" height="6" fill="black" />
                  <rect x="58" y="20" width="6" height="6" fill="black" />

                  <rect x="8" y="38" width="6" height="6" fill="black" />
                  <rect x="20" y="38" width="6" height="6" fill="black" />
                  <rect x="34" y="36" width="8" height="8" fill="black" />
                  <rect x="46" y="36" width="8" height="8" fill="black" />
                  <rect x="58" y="36" width="8" height="8" fill="black" />
                  <rect x="72" y="38" width="6" height="6" fill="black" />
                  <rect x="86" y="38" width="6" height="6" fill="black" />

                  <rect x="8" y="50" width="6" height="6" fill="black" />
                  <rect x="24" y="48" width="6" height="6" fill="black" />
                  <rect x="36" y="50" width="6" height="6" fill="black" />
                  <rect x="48" y="50" width="6" height="6" fill="black" />
                  <rect x="62" y="50" width="6" height="6" fill="black" />
                  <rect x="78" y="50" width="6" height="6" fill="black" />

                  <rect x="36" y="66" width="6" height="6" fill="black" />
                  <rect x="46" y="66" width="6" height="6" fill="black" />
                  <rect x="58" y="66" width="6" height="6" fill="black" />

                  <rect x="36" y="78" width="6" height="6" fill="black" />
                  <rect x="48" y="78" width="6" height="6" fill="black" />
                  <rect x="62" y="78" width="6" height="6" fill="black" />
                  <rect x="76" y="78" width="6" height="6" fill="black" />

                  <rect x="70" y="66" width="22" height="6" fill="black" />
                  <rect x="70" y="88" width="22" height="6" fill="black" />
                </svg>
                <span className="text-[11px] font-semibold text-slate-700">Minimarket Kita</span>
                <span className="text-xs font-bold text-emerald-600">{formatRupiah(totalAmount)}</span>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Scan QRIS melalui aplikasi perbankan atau e-wallet
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (method === 'CASH' && !isCashSufficient)}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : method === 'QRIS' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Konfirmasi Lunas
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Bayar Tunai
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
