'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Camera, Clock, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [searchVal, setSearchVal] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [clockOutRecorded, setClockOutRecorded] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync initial search from query param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) setSearchVal(q);
    }
  }, []);

  const navItems = [
    { name: 'Kasir Utama', href: '/' },
    { name: 'Stok Barang', href: '/products' },
    { name: 'Rekap Laporan', href: '/reports' },
  ];

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when requested (e.g. F2 shortcut)
  useEffect(() => {
    const handleFocusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    };
    window.addEventListener('pos-focus-search', handleFocusSearch);

    // Listen to clear search event after scan
    const handleClearSearch = () => {
      setSearchVal('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('pos-scan-clear', handleClearSearch);

    // Keyboard global shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pos-focus-search', handleFocusSearch);
      window.removeEventListener('pos-scan-clear', handleClearSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = searchVal.trim();
    if (!queryStr) return;

    if (pathname !== '/') {
      router.push(`/?q=${encodeURIComponent(queryStr)}`);
    } else {
      // Dispatch submit event for barcode/SKU scanner processing
      window.dispatchEvent(new CustomEvent('pos-scan-submit', { detail: queryStr }));
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('pos-search', { detail: val }));
    }
  };

  if (pathname === '/display') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b1120] text-slate-100 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
        {/* Brand & Search Bar */}
        <div className="flex items-center gap-6 flex-1 max-w-2xl">
          <Link href="/" className="flex flex-col flex-shrink-0">
            <span className="text-xl font-black tracking-tight text-white leading-none">
              INDO POS
            </span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">
              Minimarket &amp; Ritel
            </span>
          </Link>

          {/* Search Box in Header */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Scan Barcode / Ketik SKU / Nama Barang... (F2)"
              className="w-full pl-10 pr-4 py-2 bg-[#cbd5e1] hover:bg-slate-200 focus:bg-white text-slate-900 placeholder-slate-600 rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            />
          </form>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Cashier Profile Avatar & Popover */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
            title="Profil Kasir"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-300 mt-0.5 uppercase tracking-wider">
              SITI A.
            </span>
          </button>

          {/* Profile Popover Matching referensi.jpeg */}
          {profileOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-6 z-50 animate-in fade-in zoom-in-95">
              {/* Avatar with Camera Button */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                    <User className="w-12 h-12 stroke-[1.5]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Fitur upload foto profil kasir')}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-500 transition-colors border-2 border-white"
                    title="Ganti Foto Profil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Fitur ubah foto profil kasir')}
                  className="text-xs text-slate-500 hover:text-blue-600 mt-2 font-medium underline"
                >
                  Ganti Foto Profil
                </button>

                <h3 className="text-lg font-extrabold text-slate-900 mt-1">Siti Aminah</h3>
                <p className="text-xs text-slate-500 font-medium">ID Kasir: KSR-01</p>
              </div>

              {/* Attendance Boxes */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-slate-100/90 rounded-2xl p-3 text-center border border-slate-200/60">
                  <p className="text-[11px] text-slate-500 font-semibold">Jam Masuk</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">08:00 WIB</p>
                </div>
                <div className="bg-slate-100/90 rounded-2xl p-3 text-center border border-slate-200/60">
                  <p className="text-[11px] text-slate-500 font-semibold">Jam Keluar</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                    {clockOutRecorded ? '17:00 WIB' : '16:00 WIB'}
                  </p>
                </div>
              </div>

              {/* Catat Jam Keluar Button */}
              <button
                type="button"
                onClick={() => {
                  setClockOutRecorded(true);
                  alert('Absensi Jam Keluar Berhasil Dicatat: ' + new Date().toLocaleTimeString('id-ID') + ' WIB');
                }}
                className={`w-full mt-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] ${
                  clockOutRecorded
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {clockOutRecorded ? '✓ Jam Keluar Tercatat' : 'Catat Jam Keluar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
