"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  href: string;
  color: "blue" | "gold" | "green" | "red" | "slate" | "purple";
  icon?: ReactNode;
  subtitle?: string;
}

const colorClasses = {
  blue: "border-ukraine-blue/30 bg-ukraine-blue/10",
  gold: "border-gold/30 bg-gold/10",
  green: "border-green-500/30 bg-green-500/10",
  red: "border-red-500/30 bg-red-500/10",
  slate: "border-white/10 bg-slate-900/60",
  purple: "border-purple-500/30 bg-purple-500/10",
};

const valueColors = {
  blue: "text-ukraine-blue",
  gold: "text-gold",
  green: "text-green-400",
  red: "text-red-400",
  slate: "text-slate-300",
  purple: "text-purple-400",
};

export function StatCard({ title, value, href, color, icon, subtitle }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`block border p-4 rounded-lg transition-all duration-200 hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] min-h-[100px] touch-manipulation ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className={`font-bebas text-3xl sm:text-4xl mt-1 ${valueColors[color]}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-slate-500 opacity-50">{icon}</div>}
      </div>
    </Link>
  );
}
