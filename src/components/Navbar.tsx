'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Search, User, Camera, Clock, CheckCircle2, LogOut, ShieldCheck, UserCheck, Users } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, session, updateAvatar, clockOut, logout } = useAuth();

  const [searchVal, setSearchVal] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [clockOutMessage, setClockOutMessage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    { name: 'Kelola Kasir', href: '/cashiers' },
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

  // Real profile image upload & optimization handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file tidak didukung. Harap pilih gambar (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 300x300 for crisp quality and minimal storage footprint
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        updateAvatar(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateAvatar('');
  };

  const handleClockOut = () => {
    const recordedTime = clockOut();
    setClockOutMessage(`Absensi keluar dicatat pada ${recordedTime}`);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  if (pathname === '/display') {
    return null;
  }

  const isAdmin = currentUser?.role === 'ADMIN';

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

        {/* User Profile Avatar & Popover */}
        <div className="relative" ref={profileRef}>
          {/* Hidden File Input for Avatar Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
            title="Profil Pengguna"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-slate-300">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-700" />
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-300 mt-0.5 uppercase tracking-wider">
              {currentUser?.shortName || 'PENGGUNA'}
            </span>
          </button>

          {/* Profile Popover Matching referensi.jpeg with Live Photo Upload */}
          {profileOpen && (
            <div className="absolute right-0 top-12 w-84 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-6 z-50 animate-in fade-in zoom-in-95">
              {/* Avatar with Camera Button */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 shadow-inner overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 stroke-[1.5] text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-500 transition-colors border-2 border-white"
                    title="Upload Foto Baru"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                  >
                    Ganti Foto Profil
                  </button>
                  {currentUser?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-base font-extrabold text-slate-900">{currentUser?.name}</h3>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {currentUser?.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID Akun: {currentUser?.id}
                  </p>
                </div>
              </div>

              {/* Attendance Shift Boxes */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-100/90 rounded-2xl p-3 text-center border border-slate-200/60">
                  <p className="text-[11px] text-slate-500 font-semibold">Jam Masuk</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5 font-mono">
                    {session?.loginTime || '08:00 WIB'}
                  </p>
                </div>
                <div className="bg-slate-100/90 rounded-2xl p-3 text-center border border-slate-200/60">
                  <p className="text-[11px] text-slate-500 font-semibold">Jam Keluar</p>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5 font-mono">
                    {session?.clockOutTime || '16:00 WIB'}
                  </p>
                </div>
              </div>

              {clockOutMessage && (
                <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
                  {clockOutMessage}
                </div>
              )}

              {/* Attendance & Account Actions */}
              <div className="mt-4 space-y-2">
                <Link
                  href="/cashiers"
                  onClick={() => setProfileOpen(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kelola Akun Kasir</span>
                </Link>

                <button
                  type="button"
                  onClick={handleClockOut}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Catat Jam Keluar</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar &amp; Ganti Pengguna</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
