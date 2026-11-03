'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Users, MessageSquare, Compass, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/map', label: 'ផែនទី', subLabel: 'Map', icon: Map },
    { href: '/friends', label: 'មិត្តភក្តិ', subLabel: 'Friends', icon: Users },
    { href: '/navigation', label: 'នាំផ្លូវ', subLabel: 'Navigate', icon: Compass },
    { href: '/chat', label: 'សារ', subLabel: 'Chat', icon: MessageSquare },
    { href: '/profile', label: 'គណនី', subLabel: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 z-30 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/map' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isActive
                ? 'text-indigo-600 font-semibold scale-105'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-1 leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
