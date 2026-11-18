'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth, UserAccount, CashierInput } from '@/context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  Camera,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  LogIn,
  Search,
} from 'lucide-react';

export default function CashiersPage() {
  const { users, currentUser, addCashier, updateCashier, deleteCashier, login } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'KASIR'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState<CashierInput>({
    code: '',
    name: '',
    shortName: '',
    role: 'KASIR',
    pin: '1234',
    avatarUrl: null,
  });
  const [showPin, setShowPin] = useState(false);
  const [revealedPins, setRevealedPins] = useState<{ [id: number]: boolean }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Inline avatar upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploadTargetId, setAvatarUploadTargetId] = useState<number | null>(null);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalUsers = users.length;
  const totalCashiers = users.filter((u) => u.role === 'KASIR').length;
  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;

  const handleOpenAddModal = () => {
    setEditingUser(null);
    // Suggest next code: KSR-0 + (totalCashiers + 1)
    const nextNum = totalCashiers + 1;
    const defaultCode = `KSR-${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setFormData({
      code: defaultCode,
      name: '',
      shortName: '',
      role: 'KASIR',
      pin: '1234',
      avatarUrl: null,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      code: user.code,
      name: user.name,
      shortName: user.shortName,
      role: user.role,
      pin: user.pin,
      avatarUrl: user.avatarUrl,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Process image upload into compressed Base64
  const handleProcessImage = (file: File, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Format berkas harus berupa gambar (JPG, PNG, atau WEBP)');
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
        callback(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleProcessImage(file, (base64) => {
      setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
    });
    if (e.target) e.target.value = '';
  };

  const handleInlinePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || avatarUploadTargetId === null) return;

    handleProcessImage(file, async (base64) => {
      const res = await updateCashier(avatarUploadTargetId, { avatarUrl: base64 });
      if (res.success) {
        setSuccessBanner('Foto profil petugas berhasil diperbarui');
        setTimeout(() => setSuccessBanner(null), 3500);
      } else {
        alert(res.error || 'Gagal memperbarui foto petugas');
      }
      setAvatarUploadTargetId(null);
    });
    if (e.target) e.target.value = '';
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = formData.code.trim().toUpperCase();
    const trimmedName = formData.name.trim();
    const trimmedShortName = (
      formData.shortName || trimmedName.split(' ')[0] || trimmedCode
    ).trim().toUpperCase();

    if (!trimmedCode) {
      setFormError('Kode petugas wajib diisi');
      return;
    }

    if (!trimmedName) {
      setFormError('Nama lengkap petugas wajib diisi');
      return;
    }

    if (!/^\d{4,6}$/.test(formData.pin)) {
      setFormError('PIN harus berupa 4 sampai 6 digit angka');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingUser) {
        // Update
        const res = await updateCashier(editingUser.id, {
          code: trimmedCode,
          name: trimmedName,
          shortName: trimmedShortName,
          role: formData.role,
          pin: formData.pin,
          avatarUrl: formData.avatarUrl,
        });

        if (!res.success) {
          setFormError(res.error || 'Gagal memperbarui data petugas');
          return;
        }

        setSuccessBanner(`Data petugas "${trimmedName}" berhasil diperbarui`);
      } else {
        // Create
        const res = await addCashier({
          code: trimmedCode,
          name: trimmedName,
          shortName: trimmedShortName,
          role: formData.role,
          pin: formData.pin,
          avatarUrl: formData.avatarUrl,
        });

        if (!res.success) {
          setFormError(res.error || 'Gagal menambahkan petugas');
          return;
        }

        setSuccessBanner(`Petugas kasir "${trimmedName}" (${trimmedCode}) berhasil ditambahkan`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteError(null);

    const res = await deleteCashier(deletingUser.id);
    if (!res.success) {
      setDeleteError(res.error || 'Gagal menghapus petugas');
      return;
    }

    setSuccessBanner(`Akun petugas "${deletingUser.name}" telah dihapus`);
    setDeletingUser(null);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const toggleRevealPin = (id: number) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSwitchToThisUser = (user: UserAccount) => {
    const res = login(user.code, user.pin);
    if (res.success) {
      setSuccessBanner(`Berhasil beralih ke sesi ${user.name} (${user.role})`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } else {
      alert(res.message || 'Gagal beralih akun');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-16">
      {/* Hidden File Input for inline photo change */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInlinePhotoUpload}
        className="hidden"
      />

      {/* Top Banner Message */}
      {successBanner && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-600 text-white border-emerald-500 flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 flex-1">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              title="Kembali ke Layar Kasir"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Kelola Petugas &amp; Kasir
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Manajemen akun kasir, kredensial PIN keamanan, hak akses peran, dan foto profil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Petugas Baru</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Akun</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Petugas Kasir</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalCashiers}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrator</p>
              <p className="text-2xl font-black text-amber-600 mt-0.5">{totalAdmins}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama petugas..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-2xl text-xs font-medium border border-transparent focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'KASIR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r === 'ALL' ? 'Semua Peran' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Cashiers Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-6">Foto &amp; Identitas</th>
                  <th className="py-4 px-6">Kode Petugas</th>
                  <th className="py-4 px-6">Nama di Struk</th>
                  <th className="py-4 px-6">Peran Akses</th>
                  <th className="py-4 px-6">PIN Keamanan</th>
                  <th className="py-4 px-6">Status Sesi</th>
                  <th className="py-4 px-6 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada petugas yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrent = currentUser?.id === u.id;
                    const isPinRevealed = revealedPins[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Foto & Nama */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="relative group">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
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
                              <button
                                type="button"
                                onClick={() => {
                                  setAvatarUploadTargetId(u.id);
                                  fileInputRef.current?.click();
                                }}
                                className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                title="Ganti Foto"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-slate-900 leading-tight">
                                {u.name}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Terdaftar di sistem POS
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Kode */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-slate-900 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs">
                            {u.code}
                          </span>
                        </td>

                        {/* Nama Singkat */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-semibold text-slate-700">
                            {u.shortName}
                          </span>
                        </td>

                        {/* Peran */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {u.role === 'ADMIN' ? (
                              <Shield className="w-3 h-3 text-amber-700" />
                            ) : (
                              <User className="w-3 h-3 text-blue-700" />
                            )}
                            <span>{u.role}</span>
                          </span>
                        </td>

                        {/* PIN */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black tracking-widest text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {isPinRevealed ? u.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealPin(u.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              title={isPinRevealed ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                            >
                              {isPinRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status Sesi */}
                        <td className="py-4 px-6">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>Sedang Bertugas</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Siap</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleSwitchToThisUser(u)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 border border-slate-300/70"
                                title="Masuk / Bertugas sebagai akun ini"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Bertugas</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Edit Kredensial"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingUser(u);
                                setDeleteError(null);
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                              title="Hapus Petugas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Petugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingUser ? 'Edit Petugas Kasir' : 'Tambah Petugas Kasir Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Isi data lengkap akun kasir untuk akses ke terminal penjualan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Avatar Selector in Form */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Foto Profil Petugas
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors">
                      Pilih Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleModalPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: null }))}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format gambar JPG, PNG, atau WEBP (otomatis dioptimasi)
                  </p>
                </div>
              </div>

              {/* Kode Petugas & Peran */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    Kode Petugas *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="Contoh: KSR-01"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    Peran Akses *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as 'KASIR' | 'ADMIN',
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="KASIR">KASIR (Terminal Penjualan)</option>
                    <option value="ADMIN">ADMIN (Akses Penuh)</option>
                  </select>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                  Nama Lengkap Petugas *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name: val,
                      // Auto-fill shortName if empty or editing
                      shortName: prev.shortName || val.split(' ')[0]?.toUpperCase() || '',
                    }));
                  }}
                  placeholder="Contoh: Bagaskara Amukti"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Nama Singkat di Struk & PIN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    Nama di Struk (Maks 15 Huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortName: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Contoh: BAGASKARA"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    PIN Keamanan (4-6 Angka) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={formData.pin}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pin: e.target.value.replace(/\D/g, ''),
                        }))
                      }
                      placeholder="1234"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formSubmitting ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Petugas */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Konfirmasi Hapus Akun</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus petugas{' '}
              <span className="font-extrabold text-slate-900">
                &quot;{deletingUser.name}&quot; ({deletingUser.code})
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 active:scale-[0.98]"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
