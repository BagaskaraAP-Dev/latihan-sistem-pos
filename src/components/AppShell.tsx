'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginScreen from '@/components/LoginScreen';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  // Layar Pelanggan (/display) is public for the secondary customer monitor
  if (pathname === '/display') {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  // If cashier or admin is not logged in, display the Terminal Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Active authenticated session: display Navbar and terminal views
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
