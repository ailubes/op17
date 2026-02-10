"use client";

import { ReactNode } from "react";

interface QuickActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const variantClasses = {
  primary: "bg-gold text-slate-950 hover:bg-gold/90 shadow-lg shadow-gold/20",
  secondary: "bg-slate-700 text-white hover:bg-slate-600",
  danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
  ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
};

const sizeClasses = {
  sm: "px-3 py-2 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2.5",
};

export function QuickActionButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  className = "",
  type = "button",
}: QuickActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        font-medium uppercase tracking-wider rounded-lg
        transition-all duration-200
        min-h-[44px] touch-manipulation
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
