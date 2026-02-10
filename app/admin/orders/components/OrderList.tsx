"use client";

import { Order } from "../types";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
  orders: Order[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function OrderList({
  orders,
  selectedOrderId,
  onSelectOrder,
  loading = false,
  emptyMessage = "No orders found.",
}: OrderListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-[88px] bg-slate-900/40 border border-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isSelected={selectedOrderId === order.id}
          onClick={() => onSelectOrder(order.id)}
        />
      ))}
    </div>
  );
}
