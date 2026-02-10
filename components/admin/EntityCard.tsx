"use client";

import { ReactNode } from "react";

interface Badge {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "purple";
}

interface EntityCardProps {
  title: string;
  subtitle?: string;
  badges?: Badge[];
  meta?: { label: string; value: string }[] | ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  isInactive?: boolean;
}

const badgeVariants = {
  default: "bg-slate-700 text-slate-300 border-slate-600",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-ukraine-blue/20 text-ukraine-blue border-ukraine-blue/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function EntityCard({
  title,
  subtitle,
  badges,
  meta,
  footer,
  actions,
  children,
  className = "",
  onClick,
  isInactive,
}: EntityCardProps) {
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all duration-200
        ${isInactive ? "border-slate-700 bg-slate-900/20 opacity-70" : "border-white/10 bg-slate-900/40"}
        ${onClick ? "cursor-pointer hover:border-gold/50 active:scale-[0.99]" : ""}
        touch-manipulation
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bebas text-xl text-white truncate">{title}</h3>
            {badges?.map((badge, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded ${badgeVariants[badge.variant || "default"]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
          {subtitle && <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-1">{subtitle}</p>}
          {meta && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              {Array.isArray(meta) ? (
                meta.map((item, i) => (
                  <span key={i}>
                    <span className="text-slate-600">{item.label}:</span> {item.value}
                  </span>
                ))
              ) : (
                meta
              )}
            </div>
          )}
        </div>
        {footer && (
          <div className="mt-3 pt-3 border-t border-white/5">
            {footer}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
