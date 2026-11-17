'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserAccount {
  id: string;
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

interface AuthContextType {
  currentUser: UserAccount | null;
  session: UserSession | null;
  users: UserAccount[];
  login: (userId: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  updateAvatar: (avatarBase64: string) => void;
  clockOut: () => string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'KSR-01',
    name: 'Siti Aminah',
    shortName: 'SITI A.',
    role: 'KASIR',
    pin: '1234',
    avatarUrl: null,
  },
  {
    id: 'ADM-01',
    name: 'Bagaskara AP',
    shortName: 'BAGASKARA',
    role: 'ADMIN',
    pin: '1234',
    avatarUrl: null,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load users and current session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem('indo_pos_users');
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        } else {
          localStorage.setItem('indo_pos_users', JSON.stringify(DEFAULT_USERS));
        }

        const storedSession = localStorage.getItem('indo_pos_session');
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }
      } catch (err) {
        console.error('Failed to load auth from localStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  const saveUsers = (updatedUsers: UserAccount[]) => {
    setUsers(updatedUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('indo_pos_users', JSON.stringify(updatedUsers));
    }
  };

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

  const login = (userId: string, pin: string): { success: boolean; message?: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'ID Pengguna tidak terdaftar dalam sistem.' };
    }

    if (targetUser.pin !== pin) {
      return { success: false, message: 'PIN yang dimasukkan salah.' };
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

  const updateAvatar = (avatarBase64: string) => {
    if (!session) return;

    const updatedUser: UserAccount = {
      ...session.user,
      avatarUrl: avatarBase64,
    };

    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveUsers(updatedUsers);

    const updatedSession: UserSession = {
      ...session,
      user: updatedUser,
    };
    saveSession(updatedSession);
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
        login,
        logout,
        updateAvatar,
        clockOut,
      }}
    >
      {isLoaded ? children : null}
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
