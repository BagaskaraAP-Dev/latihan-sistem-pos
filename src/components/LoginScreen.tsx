'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserAccount } from '@/context/AuthContext';
import { User, Shield, KeyRound, Clock, Delete, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const { users, login } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserAccount>(users[0] || null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Live WIB clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ' - ' +
          now.toLocaleTimeString('id-ID') +
          ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard number listener for PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 6) {
          setPin((prev) => prev + e.key);
          setError(null);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError(null);
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedUser]);

  const handleNumpad = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      setError('Pilih pengguna terlebih dahulu.');
      return;
    }
    if (!pin) {
      setError('Masukkan PIN keamanan.');
      return;
    }

    const res = login(selectedUser.id, pin);
    if (!res.success) {
      setError(res.message || 'PIN yang dimasukkan salah.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-slate-800/80 bg-[#0d1322] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
            IP
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">INDO POS</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Terminal Masuk Gerai &bull; Autentikasi Pengguna</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/60 text-slate-300 text-xs font-mono">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{currentTime || 'Memuat waktu...'}</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Masuk Terminal Kasir</h2>
            <p className="text-xs text-slate-400">Pilih akun pengguna yang bertugas lalu masukkan PIN keamanan</p>
          </div>

          {/* User Account Selection Cards */}
          <div className="grid grid-cols-2 gap-4">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const isAdmin = u.role === 'ADMIN';

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                    setError(null);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center relative ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Role Badge */}
                  <span
                    className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {u.role}
                  </span>

                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden mb-2 mt-1 shadow-inner">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-white">{u.name}</h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{u.id}</p>
                </div>
              );
            })}
          </div>

          {/* PIN Input Dots & Display */}
          <div className="bg-[#0b101c] rounded-2xl p-4 border border-slate-800 flex flex-col items-center space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Masukkan PIN untuk {selectedUser?.name}</span>
            </div>

            {/* PIN Bullets */}
            <div className="flex items-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all ${
                      filled ? 'bg-blue-500 shadow-sm shadow-blue-500/50 scale-110' : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Touch / Click Numpad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumpad(digit)}
                className="py-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg rounded-xl border border-slate-700/60 transition-all shadow-xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/60 transition-all"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleNumpad('0')}
              className="py-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg rounded-xl border border-slate-700/60 transition-all shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3.5 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center rounded-xl border border-slate-700/60 transition-all"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pin.length === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Buka Terminal Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2.5">
              Petunjuk latihan: Gunakan PIN bawaan <span className="text-slate-300 font-mono font-bold">1234</span> untuk login.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-3.5 border-t border-slate-800/80 bg-[#0d1322] flex items-center justify-between text-xs text-slate-400">
        <div>Sistem Kasir Ritel Full-Stack &bull; Mode Keamanan Terminal</div>
        <div className="font-mono text-slate-500">PT. SUMBER RETAIL NUSANTARA</div>
      </footer>
    </div>
  );
}
