'use client';

import React from 'react';
import { Transaction } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { Printer, XCircle, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const dpp = Math.round(transaction.total_amount / 1.11);
  const ppn = Math.round(transaction.total_amount - dpp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>Transaksi Berhasil</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/50">
          <div
            id="printable-receipt"
            className="bg-white text-black p-4 rounded font-mono text-[11px] leading-tight shadow-md mx-auto max-w-[280px]"
          >
            <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
              <p className="font-bold text-sm tracking-widest">MINIMARKET KITA</p>
              <p className="text-[10px]">Jl. Sudirman No. 12</p>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>STRUK:</span>
                <span className="font-bold">{transaction.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span>WAKTU:</span>
                <span>{formatDateTime(transaction.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>KASIR:</span>
                <span>{transaction.cashier_name ? transaction.cashier_name.toUpperCase() : 'KASIR'}</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1.5">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[10px] uppercase truncate">{item.product_name}</div>
                  <div className="flex justify-between text-[10px]">
                    <span>
                      {item.quantity} x {formatRupiah(item.selling_price)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>TOTAL ITEM:</span>
                <span>{transaction.items?.reduce((s, i) => s + i.quantity, 0)} PCS</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(transaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-700">
                <span>DPP: {formatRupiah(dpp)}</span>
                <span>PPN 11%: {formatRupiah(ppn)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>PEMBAYARAN:</span>
                <span className="font-bold uppercase">{transaction.payment_method}</span>
              </div>
              {transaction.payment_method === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>TUNAI:</span>
                    <span>{formatRupiah(transaction.cash_received)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>KEMBALIAN:</span>
                    <span>{formatRupiah(transaction.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 text-center space-y-1 text-[9px]">
              <div className="tracking-widest font-mono font-bold text-xs py-1">
                ||| | ||||| || ||||||| | ||||
              </div>
              <p className="font-bold">LAYANAN KONSUMEN WA: 0812-3456-7890</p>
              <p className="font-bold">*** TERIMA KASIH ***</p>
              <p>SELAMAT BELANJA KEMBALI</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-[44px] py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
