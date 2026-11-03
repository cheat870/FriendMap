'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showBottom?: boolean;
  title?: string;
  showBack?: boolean;
}

export default function MainLayout({
  children,
  showNav = true,
  showBottom = true,
  title,
  showBack = false,
}: MainLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">កំពុងដំណើរការ FriendMap...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showNav && <Navbar title={title} showBack={showBack} />}
      <main className={`flex-1 ${showBottom ? 'pb-16' : ''}`}>
        {children}
      </main>
      {showBottom && <BottomNav />}
    </div>
  );
}
