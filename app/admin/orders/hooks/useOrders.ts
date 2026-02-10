"use client";

import { useState, useEffect, useCallback } from "react";
import { Order } from "../types";

interface UseOrdersOptions {
  statusFilter?: string;
  searchQuery?: string;
  refreshInterval?: number;
}

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  counts: Record<string, number>;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { statusFilter = "all", searchQuery = "", refreshInterval } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const url = `/api/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await res.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optional auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(fetchOrders, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOrders, refreshInterval]);

  // Calculate counts for filter chips
  const counts = orders.reduce(
    (acc, order) => {
      acc.all = (acc.all || 0) + 1;
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    { all: 0 } as Record<string, number>
  );

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    counts,
  };
}
