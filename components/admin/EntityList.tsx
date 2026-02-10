"use client";

import { ReactNode } from "react";

interface EntityListProps {
  children: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  count?: number;
  total?: number;
  title?: string;
  actions?: ReactNode;
}

export function EntityList({
  children,
  loading,
  emptyMessage = "No items found.",
  count,
  total,
  title,
  actions,
}: EntityListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-[80px] bg-slate-900/40 border border-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="space-y-4">
      {(title || count !== undefined) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="font-bebas text-xl text-slate-300">{title}</h2>}
          {count !== undefined && (
            <span className="text-sm text-slate-500">
              {count} {total !== undefined && total !== count ? `of ${total}` : ""}
              {count === 1 ? " item" : " items"}
            </span>
          )}
          {actions}
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-12 border border-white/10 bg-slate-900/40 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}
