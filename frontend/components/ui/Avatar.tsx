'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  displayName?: string;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { outer: string; img: number; dot: string }> = {
  xs: { outer: 'w-7 h-7 text-xs',   img: 28,  dot: 'w-2 h-2 border' },
  sm: { outer: 'w-8 h-8 text-xs',   img: 32,  dot: 'w-2.5 h-2.5 border' },
  md: { outer: 'w-12 h-12 text-sm', img: 48,  dot: 'w-3 h-3 border-2' },
  lg: { outer: 'w-16 h-16 text-base', img: 64, dot: 'w-3.5 h-3.5 border-2' },
  xl: { outer: 'w-24 h-24 text-xl', img: 96,  dot: 'w-4 h-4 border-2' },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, displayName, name, size = 'md', online, className }: AvatarProps) {
  const targetName = displayName || name || 'User';
  const { outer, img, dot } = sizeMap[size];
  const initials = getInitials(targetName);
  const bgColor = stringToColor(targetName);

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-bold text-white select-none',
          outer,
          bgColor
        )}
      >
        {src ? (
          <img
            src={src}
            alt={targetName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            dot,
            online ? 'bg-emerald-500' : 'bg-gray-400'
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

export default Avatar;
