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
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>TRANSAKSI KASIR SUKSES</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area: Authentic Thermal Paper Receipt */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/50">
          <div
            id="printable-receipt"
            className="bg-white text-black p-4 rounded font-mono text-[11px] leading-tight shadow-md mx-auto max-w-[280px]"
          >
            {/* Store Banner */}
            <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
              <p className="font-bold text-sm tracking-widest">INDOPOS MINIMARKET</p>
              <p className="text-[10px]">PT. SUMBER RETAIL NUSANTARA</p>
              <p className="text-[9px]">JL. PANGLIMA POLIM NO. 28, JAKSEL</p>
              <p className="text-[9px]">NPWP: 01.345.678.9-012.000</p>
            </div>

            {/* Transaction Metadata */}
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
                <span>{transaction.cashier_name ? transaction.cashier_name.toUpperCase() : 'PETUGAS KASIR'}</span>
              </div>
            </div>

            {/* Items Scanned */}
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

            {/* Totals & Tax Calculation */}
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
                    <span>TUNAI DITERIMA:</span>
                    <span>{formatRupiah(transaction.cash_received)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>KEMBALIAN:</span>
                    <span>{formatRupiah(transaction.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Barcode & Customer Care */}
            <div className="pt-2 text-center space-y-1 text-[9px]">
              <div className="tracking-widest font-mono font-bold text-xs py-1">
                ||| | ||||| || ||||||| | ||||
              </div>
              <p className="font-bold">LAYANAN KONSUMEN WA: 0811-1500-280</p>
              <p className="font-bold">*** TERIMA KASIH ***</p>
              <p>SELAMAT BELANJA KEMBALI</p>
              <p className="text-[8px] text-gray-600">BARANG YANG SUDAH DIBELI TIDAK BISA DITUKAR</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>CETAK STRUK</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded transition-colors"
          >
            TRANSAKSI BARU
          </button>
        </div>
      </div>
    </div>
  );
}
