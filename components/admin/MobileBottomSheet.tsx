"use client";

import { useEffect, useCallback, ReactNode } from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showHandle?: boolean;
  maxHeight?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  maxHeight = "90vh",
}: MobileBottomSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      />
      <div
        className="relative w-full bg-slate-950 border-t border-white/10 rounded-t-2xl shadow-2xl animate-slide-up"
        style={{ maxHeight }}
      >
        {showHandle && (
          <div className="flex items-center justify-center pt-3 pb-2" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
            <h2 className="font-bebas text-2xl text-white tracking-wide">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - ${title ? "60px" : "40px"})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
