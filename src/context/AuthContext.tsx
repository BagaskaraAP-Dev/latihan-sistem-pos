'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserAccount {
  id: number;
  code: string;
  name: string;
  shortName: string;
  role: 'KASIR' | 'ADMIN';
  pin: string;
  avatarUrl: string | null;
}

export interface UserSession {
  user: UserAccount;
  loginTime: string;
  clockOutTime: string | null;
}

export interface CashierInput {
  code: string;
  name: string;
  shortName?: string;
  role: 'KASIR' | 'ADMIN';
  pin: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  session: UserSession | null;
  users: UserAccount[];
  isLoading: boolean;
  login: (codeOrId: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  updateAvatar: (avatarBase64: string) => Promise<{ success: boolean; error?: string }>;
  clockOut: () => string;
  fetchUsers: () => Promise<void>;
  addCashier: (data: CashierInput) => Promise<{ success: boolean; error?: string }>;
  updateCashier: (id: number, data: Partial<CashierInput>) => Promise<{ success: boolean; error?: string }>;
  deleteCashier: (id: number) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial fallback only if database is offline during cold start
const FALLBACK_USERS: UserAccount[] = [
  {
    id: 1,
    code: 'ADM-01',
    name: 'Bagaskara AP',
    shortName: 'BAGASKARA',
    role: 'ADMIN',
    pin: '1234',
    avatarUrl: null,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(FALLBACK_USERS);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map DB row to UserAccount
  const mapCashierRow = (row: any): UserAccount => ({
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    shortName: String(row.short_name || row.name),
    role: row.role === 'ADMIN' ? 'ADMIN' : 'KASIR',
    pin: String(row.pin || '1234'),
    avatarUrl: row.avatar_url || null,
  });

  // Fetch cashiers from database API
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/cashiers', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapCashierRow);
          setUsers(mapped);

          // Purge stale or legacy 'Siti Aminah' from localStorage
          if (typeof window !== 'undefined') {
            const rawSession = localStorage.getItem('indo_pos_session');
            if (rawSession) {
              try {
                const parsed = JSON.parse(rawSession);
                if (parsed?.user?.name === 'Siti Aminah' || parsed?.user?.code === 'KSR-01') {
                  localStorage.removeItem('indo_pos_session');
                  setSession(null);
                } else {
                  // Keep session user synchronized with latest database row
                  const matched = mapped.find(
                    (u) => u.id === parsed?.user?.id || u.code === parsed?.user?.code
                  );
                  if (matched) {
                    const refreshedSession: UserSession = {
                      ...parsed,
                      user: matched,
                    };
                    setSession(refreshedSession);
                    localStorage.setItem('indo_pos_session', JSON.stringify(refreshedSession));
                  } else {
                    localStorage.removeItem('indo_pos_session');
                    setSession(null);
                  }
                }
              } catch (e) {
                localStorage.removeItem('indo_pos_session');
                setSession(null);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch cashiers from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Purge any legacy localStorage items referencing 'Siti Aminah'
    if (typeof window !== 'undefined') {
      try {
        const storedUsersRaw = localStorage.getItem('indo_pos_users');
        if (storedUsersRaw && storedUsersRaw.includes('Siti Aminah')) {
          localStorage.removeItem('indo_pos_users');
        }
        const storedSessionRaw = localStorage.getItem('indo_pos_session');
        if (storedSessionRaw && storedSessionRaw.includes('Siti Aminah')) {
          localStorage.removeItem('indo_pos_session');
        } else if (storedSessionRaw) {
          setSession(JSON.parse(storedSessionRaw));
        }
      } catch (e) {
        console.error('Error reading localStorage session:', e);
      }
    }

    fetchUsers();
  }, [fetchUsers]);

  const saveSession = (newSession: UserSession | null) => {
    setSession(newSession);
    if (typeof window !== 'undefined') {
      if (newSession) {
        localStorage.setItem('indo_pos_session', JSON.stringify(newSession));
      } else {
        localStorage.removeItem('indo_pos_session');
      }
    }
  };

  const login = (codeOrId: string, pin: string): { success: boolean; message?: string } => {
    const targetUser = users.find(
      (u) =>
        u.code.toUpperCase() === codeOrId.trim().toUpperCase() ||
        String(u.id) === codeOrId.trim()
    );

    if (!targetUser) {
      return { success: false, message: 'Akun petugas tidak terdaftar dalam sistem.' };
    }

    if (targetUser.pin !== pin.trim()) {
      return { success: false, message: 'PIN keamanan yang dimasukkan salah.' };
    }

    const now = new Date();
    const loginTime =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newSession: UserSession = {
      user: targetUser,
      loginTime,
      clockOutTime: null,
    };

    saveSession(newSession);
    return { success: true };
  };

  const logout = () => {
    saveSession(null);
  };

  const updateAvatar = async (avatarBase64: string): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user?.id) {
      return { success: false, error: 'Tidak ada sesi pengguna aktif' };
    }

    try {
      const res = await fetch(`/api/cashiers/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarBase64 || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error || 'Gagal menyimpan foto profil' };
      }

      const updatedRow = await res.json();
      const updatedUser = mapCashierRow(updatedRow);

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      const updatedSession: UserSession = {
        ...session,
        user: updatedUser,
      };
      saveSession(updatedSession);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server' };
    }
  };

  const addCashier = async (data: CashierInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: any = {
        ...data,
        avatar_url: data.avatarUrl,
        short_name: data.shortName,
      };
      const res = await fetch('/api/cashiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Gagal menambahkan kasir' };
      }

      const created = await res.json();
      const mapped = mapCashierRow(created);
      setUsers((prev) => [...prev, mapped]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server' };
    }
  };

  const updateCashier = async (
    id: number,
    data: Partial<CashierInput>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: any = { ...data };
      if (data.avatarUrl !== undefined) {
        payload.avatar_url = data.avatarUrl;
      }
      if (data.shortName !== undefined) {
        payload.short_name = data.shortName;
      }

      const res = await fetch(`/api/cashiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Gagal memperbarui kasir' };
      }

      const updatedRow = await res.json();
      const updatedUser = mapCashierRow(updatedRow);

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

      // If updating currently logged in user, refresh current session
      if (session?.user?.id === id) {
        const updatedSession: UserSession = {
          ...session,
          user: updatedUser,
        };
        saveSession(updatedSession);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server' };
    }
  };

  const deleteCashier = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/cashiers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Gagal menghapus kasir' };
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));

      // If user deleted themselves, logout
      if (session?.user?.id === id) {
        logout();
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server' };
    }
  };

  const clockOut = (): string => {
    const now = new Date();
    const timeStr =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' WIB';

    if (session) {
      const updatedSession: UserSession = {
        ...session,
        clockOutTime: timeStr,
      };
      saveSession(updatedSession);
    }
    return timeStr;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: session?.user || null,
        session,
        users,
        isLoading,
        login,
        logout,
        updateAvatar,
        clockOut,
        fetchUsers,
        addCashier,
        updateCashier,
        deleteCashier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
