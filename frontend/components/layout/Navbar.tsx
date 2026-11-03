'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Settings, Shield, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
}

export default function Navbar({ title, showBack }: NavbarProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-30 sticky top-0">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
        ) : (
          <Link href="/profile" className="flex items-center gap-2">
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || 'User'}
              size="sm"
            />
          </Link>
        )}

        <div>
          <h1 className="font-bold text-gray-900 text-base leading-tight">
            {title || 'FriendMap'}
          </h1>
          {!title && (
            <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sharing
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
            title="Admin Dashboard"
          >
            <Shield className="w-5 h-5 text-indigo-600" />
          </Link>
        )}

        <Link
          href="/notifications"
          className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </Link>

        <Link
          href="/settings"
          className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
