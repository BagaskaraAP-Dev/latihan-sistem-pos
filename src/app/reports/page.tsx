'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, ReportSummary } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/format';
import ReceiptModal from '@/components/ReceiptModal';
import {
  FileText,
  DollarSign,
  Receipt,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  QrCode,
  Banknote,
  TrendingUp,
  Printer,
} from 'lucide-react';

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>({
    totalRevenue: 0,
    totalTransactions: 0,
    estimatedProfit: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'CASH' | 'QRIS'>('ALL');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, txRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/transactions'),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch = t.invoice_no.toLowerCase().includes(search.toLowerCase());
    const matchMethod = filterMethod === 'ALL' || t.payment_method === filterMethod;
    return matchSearch && matchMethod;
  });

  const toggleExpand = (id: number) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rekap Laporan Penjualan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis penerimaan kasir, total omzet, laba kotor, dan riwayat transaksi gerai.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors border border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Omzet Penjualan</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatRupiah(summary.totalRevenue)}
            </span>
            <p className="text-xs text-slate-400 mt-1">Akumulasi seluruh transaksi selesai</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Struk Transaksi</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-indigo-600 tracking-tight">
              {summary.totalTransactions} Struk
            </span>
            <p className="text-xs text-slate-400 mt-1">Total nota kasir tercatat</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Estimasi Laba Kotor</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatRupiah(summary.estimatedProfit)}
            </span>
            <p className="text-xs text-slate-400 mt-1">Margin Kotor (Harga Jual - Modal)</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor nota struk..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'CASH', 'QRIS'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setFilterMethod(method)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                filterMethod === method
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {method === 'ALL' ? 'Semua Metode' : method}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-extrabold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-4 px-4">No. Struk Invoice</th>
                <th className="py-4 px-4">Tanggal &amp; Waktu</th>
                <th className="py-4 px-4">Metode Bayar</th>
                <th className="py-4 px-4 text-right">Total Transaksi</th>
                <th className="py-4 px-4 text-center">Rincian Barang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Belum ada riwayat transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        onClick={() => toggleExpand(tx.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {tx.invoice_no}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              tx.payment_method === 'QRIS'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {tx.payment_method === 'QRIS' ? (
                              <QrCode className="w-3.5 h-3.5" />
                            ) : (
                              <Banknote className="w-3.5 h-3.5" />
                            )}
                            <span>{tx.payment_method}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                          {formatRupiah(tx.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                          >
                            <span>{tx.items?.length || 0} barang</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable items breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={5} className="p-4 border-y border-slate-200">
                            <div className="max-w-2xl mx-auto space-y-2">
                              <div className="text-xs font-bold text-slate-500 uppercase border-b border-slate-200 pb-1 flex justify-between">
                                <span>Detail Barang yang Dibeli</span>
                                <span>Rincian Margin</span>
                              </div>
                              <div className="divide-y divide-slate-200/60 text-xs">
                                {tx.items?.map((item, idx) => {
                                  const profit = (item.selling_price - item.cost_price) * item.quantity;
                                  return (
                                    <div key={idx} className="py-2 flex justify-between items-center">
                                      <div>
                                        <p className="font-bold text-slate-900">{item.product_name}</p>
                                        <p className="text-[11px] text-slate-500">
                                          {item.quantity} x {formatRupiah(item.selling_price)} (Modal: {formatRupiah(item.cost_price)})
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-slate-900 font-mono">{formatRupiah(item.subtotal)}</p>
                                        <p className="text-[11px] text-emerald-600 font-bold font-mono">
                                          +Laba: {formatRupiah(profit)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                {tx.payment_method === 'CASH' ? (
                                  <div className="text-xs text-slate-600 font-mono">
                                    <span>Tunai: {formatRupiah(tx.cash_received)}</span>
                                    <span className="font-bold text-emerald-700 ml-4">
                                      Kembalian: {formatRupiah(tx.change_amount)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-600 font-mono">
                                    <span>Status: Lunas via QRIS</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTxForReceipt(tx);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                                  title="Cetak Ulang Struk Thermal"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Cetak Ulang Struk</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CETAK ULANG STRUK */}
      <ReceiptModal
        transaction={selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
}
