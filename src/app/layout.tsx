import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'INDO POS - Minimarket & Ritel',
  description: 'Sistem Kasir Modern Minimarket & Ritel UMKM Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#f1f5f9] text-slate-900 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
