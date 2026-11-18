'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserAccount, CashierInput } from '@/context/AuthContext';
import {
  User,
  Shield,
  KeyRound,
  Clock,
  Delete,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Camera,
  Store,
} from 'lucide-react';

export default function LoginScreen() {
  const { users, login, addCashier, updateCashier } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(users[0] || null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Register Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<CashierInput>({
    code: '',
    name: '',
    shortName: '',
    role: 'KASIR',
    pin: '1234',
    avatarUrl: null,
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected user when users list loads or changes
  useEffect(() => {
    if (users.length > 0) {
      if (!selectedUser || !users.some((u) => u.id === selectedUser.id)) {
        setSelectedUser(users[0]);
      }
    }
  }, [users, selectedUser]);

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
      if (isAddModalOpen) return; // Ignore if adding a user

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
  }, [pin, selectedUser, isAddModalOpen]);

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
      setError('Pilih petugas terlebih dahulu.');
      return;
    }
    if (!pin) {
      setError('Masukkan PIN keamanan petugas.');
      return;
    }

    const res = login(selectedUser.code, pin);
    if (!res.success) {
      setError(res.message || 'PIN yang dimasukkan salah.');
      setPin('');
    }
  };

  const handleOpenAddCashier = () => {
    const countKasir = users.filter((u) => u.role === 'KASIR').length + 1;
    const codeSuggest = `KSR-${countKasir < 10 ? '0' + countKasir : countKasir}`;
    setNewUserData({
      code: codeSuggest,
      name: '',
      shortName: '',
      role: 'KASIR',
      pin: '1234',
      avatarUrl: null,
    });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleProcessImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setModalError('Format berkas harus berupa gambar JPG, PNG, atau WEBP');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
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
        setNewUserData((prev) => ({ ...prev, avatarUrl: base64 }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCardPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    if (!file.type.startsWith('image/')) {
      setError('Format berkas harus berupa gambar (JPG, PNG, atau WEBP).');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoFeedback('Menyimpan foto profil...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
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
          const res = await updateCashier(selectedUser.id, { avatarUrl: base64 });
          if (res.success) {
            setSelectedUser((prev) => (prev ? { ...prev, avatarUrl: base64 } : null));
            setPhotoFeedback('Foto profil petugas berhasil diperbarui');
            setTimeout(() => setPhotoFeedback(null), 3500);
          } else {
            setPhotoFeedback(res.error || 'Gagal menyimpan foto');
            setTimeout(() => setPhotoFeedback(null), 4000);
          }
        } catch (err: any) {
          setPhotoFeedback('Gagal memproses gambar');
          setTimeout(() => setPhotoFeedback(null), 3000);
        } finally {
          setIsUploadingPhoto(false);
          if (cardFileInputRef.current) cardFileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        setPhotoFeedback('Gagal membaca gambar');
        setTimeout(() => setPhotoFeedback(null), 3000);
        if (cardFileInputRef.current) cardFileInputRef.current.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedCode = newUserData.code.trim().toUpperCase();
    const trimmedName = newUserData.name.trim();
    const trimmedShortName = (
      newUserData.shortName || trimmedName.split(' ')[0] || trimmedCode
    ).trim().toUpperCase();

    if (!trimmedCode) {
      setModalError('Kode petugas wajib diisi');
      return;
    }

    if (!trimmedName) {
      setModalError('Nama lengkap petugas wajib diisi');
      return;
    }

    if (!/^\d{4,6}$/.test(newUserData.pin)) {
      setModalError('PIN harus berupa 4 sampai 6 digit angka');
      return;
    }

    try {
      setIsSubmittingNewUser(true);
      const res = await addCashier({
        code: trimmedCode,
        name: trimmedName,
        shortName: trimmedShortName,
        role: newUserData.role,
        pin: newUserData.pin,
        avatarUrl: newUserData.avatarUrl,
      });

      if (!res.success) {
        setModalError(res.error || 'Gagal menambahkan petugas kasir');
        return;
      }

      setIsAddModalOpen(false);
      setPin('');
      setError(null);
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-slate-100 flex flex-col justify-between select-none overflow-y-auto">
      {/* Top Header */}
      <header className="px-6 sm:px-8 py-4 border-b border-slate-800/80 bg-[#0d1322] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20">
            IP
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">INDO POS</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Terminal Masuk Gerai &bull; Autentikasi Kredensial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/60 text-slate-300 text-xs font-mono">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{currentTime || 'Memuat waktu...'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pilih Petugas &amp; Masuk
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih akun yang bertugas hari ini, lalu masukkan PIN keamanan
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCashier}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Kasir</span>
            </button>
          </div>

          {/* User Account Selection Cards */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Daftar Petugas Terdaftar ({users.length} Akun)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
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
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center relative ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Role Badge */}
                    <span
                      className={`absolute top-2 right-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {u.role}
                    </span>

                    {/* Avatar Thumbnail */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden mb-2 mt-1 shadow-inner">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cardFileInputRef.current?.click();
                          }}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md border-2 border-slate-900 transition-transform active:scale-90"
                          title="Ganti Foto Profil Petugas Ini"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-extrabold text-xs text-white truncate max-w-full">
                      {u.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{u.code}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden File Input for Card Avatar Upload */}
          <input
            ref={cardFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCardPhotoUpload}
            className="hidden"
          />

          {/* PIN Input Dots & Status */}
          <div className="bg-[#0b101c] rounded-2xl p-4 border border-slate-800 flex flex-col items-center space-y-2.5">
            <div className="flex items-center justify-between w-full px-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>
                  PIN Keamanan untuk:{' '}
                  <span className="text-white font-extrabold">{selectedUser?.name || '-'}</span> (
                  {selectedUser?.code || '-'})
                </span>
              </div>
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => cardFileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 underline disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Menyimpan...' : 'Ganti Foto'}</span>
              </button>
            </div>

            {photoFeedback && (
              <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{photoFeedback}</span>
              </div>
            )}

            {/* PIN Bullets */}
            <div className="flex items-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all ${
                      filled
                        ? 'bg-blue-500 shadow-sm shadow-blue-500/50 scale-110'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
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
                className="py-3 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg rounded-xl border border-slate-700/60 transition-all shadow-xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/60 transition-all"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleNumpad('0')}
              className="py-3 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg rounded-xl border border-slate-700/60 transition-all shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center rounded-xl border border-slate-700/60 transition-all"
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Buka Terminal Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2.5">
              Ketikkan PIN via keyboard atau tombol layar &bull; PIN bawaan:{' '}
              <span className="text-slate-300 font-mono font-bold">1234</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-8 py-3.5 border-t border-slate-800/80 bg-[#0d1322] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
        <div>Sistem Kasir Ritel Full-Stack &bull; Mode Keamanan Terminal</div>
        <div className="font-mono text-slate-500">PT. SUMBER RETAIL NUSANTARA</div>
      </footer>

      {/* QUICK REGISTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-5 animate-in fade-in zoom-in-95 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Daftarkan Petugas Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambahkan akun kasir atau admin untuk login terminal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewUser} className="space-y-4">
              {/* Photo preview and upload */}
              <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {newUserData.avatarUrl ? (
                    <img
                      src={newUserData.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Foto Profil (Opsional)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pilih Foto</span>
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessImage(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Kode Petugas & Peran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kode Petugas *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.code}
                    onChange={(e) =>
                      setNewUserData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="KSR-02"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Peran Akses</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        role: e.target.value as 'KASIR' | 'ADMIN',
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="KASIR">KASIR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) =>
                    setNewUserData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      shortName: prev.shortName || e.target.value.split(' ')[0]?.toUpperCase() || '',
                    }))
                  }
                  placeholder="Contoh: Budi Pratama"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Nama Singkat & PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama di Struk
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={newUserData.shortName}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        shortName: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="BUDI P."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    PIN (4-6 Angka) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={newUserData.pin}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        pin: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="1234"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-white focus:outline-none focus:border-blue-500 tracking-widest"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewUser}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingNewUser ? 'Menyimpan...' : 'Daftarkan Petugas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
