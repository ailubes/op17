"use client";

import { Order } from "../types";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency, formatDate, getOrderSummary } from "../utils";

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
}

export function OrderCard({ order, isSelected, onClick }: OrderCardProps) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left
        bg-slate-900/40 border border-white/10
        p-4 rounded-lg
        transition-all duration-200
        min-h-[88px] touch-manipulation
        active:scale-[0.99]
        ${
          isSelected
            ? "border-gold bg-slate-900/80 shadow-lg shadow-gold/10"
            : "hover:border-white/20 hover:bg-slate-900/60"
        }
      `}
      aria-pressed={isSelected}
    >
      {/* Top Row: Order #, Status, Amount */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bebas text-xl text-white tracking-wide">
            #{order.orderNumber}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} size="sm" />
          <span className="text-sm font-medium text-slate-200">
            {formatCurrency(order.totalMinor, order.currency)}
          </span>
        </div>
      </div>

      {/* Middle: Email */}
      <p className="text-sm text-slate-400 truncate mb-2">{order.email}</p>

      {/* Bottom: Items count & Date */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatDate(order.createdAt)}
        </span>
      </div>
    </button>
  );
}
