'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  className,
  maxHeight = 'max-h-[85vh]',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Touch drag-to-close
  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 80) onClose();
    isDraggingRef.current = false;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'rounded-t-3xl bg-white shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          maxHeight,
          'overflow-y-auto',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>
        {children}
      </div>
    </>
  );
}
