import { useState, useEffect, useCallback } from "react";
import { AdminEventType } from "@prisma/client";

export interface AuditLog {
  id: string;
  type: AdminEventType;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  targetUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface UseAuditLogsOptions {
  search?: string;
  category?: string;
  type?: AdminEventType;
  days?: number;
  limit?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = options.limit || 50;

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);

    const currentOffset = reset ? 0 : offset;

    try {
      const params = new URLSearchParams();
      if (options.search) params.set("search", options.search);
      if (options.type) params.set("type", options.type);
      if (options.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - options.days);
        params.set("startDate", startDate.toISOString());
      }
      params.set("limit", String(limit));
      params.set("offset", String(currentOffset));

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();

      // Filter by category on client side since the API doesn't support it directly
      let filteredLogs = data.logs;
      if (options.category && options.category !== "all") {
        filteredLogs = data.logs.filter((log: AuditLog) => {
          const type = log.type;
          // Map event types to categories
          const categoryMap: Record<string, string[]> = {
            users: ["USER_CREATED", "USER_UPDATED", "USER_ROLES_UPDATED", "USER_DEACTIVATED", "USER_REACTIVATED", "USER_PASSWORD_RESET_LINK", "USER_INVITE_LINK", "USER_LOGIN", "USER_LOGOUT"],
            orders: ["ORDER_STATUS_UPDATED", "ORDER_TRACKING_ADDED", "ORDER_NOTE_ADDED", "REFUND_CREATED", "REFUND_UPDATED"],
            products: ["PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED", "VARIANT_CREATED", "VARIANT_UPDATED", "VARIANT_DELETED", "VARIANT_STOCK_UPDATED", "CATEGORY_CREATED", "CATEGORY_UPDATED", "CATEGORY_DELETED", "COLLECTION_CREATED", "COLLECTION_UPDATED", "COLLECTION_DELETED", "PROMO_CODE_CREATED", "PROMO_CODE_UPDATED", "PROMO_CODE_DELETED"],
          };
          return categoryMap[options.category]?.includes(type);
        });
      }

      if (reset) {
        setLogs(filteredLogs);
      } else {
        setLogs((prev) => [...prev, ...filteredLogs]);
      }

      setHasMore(data.pagination.hasMore);
      setOffset(currentOffset + limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [options.search, options.category, options.type, options.days, limit, offset]);

  // Reset and fetch when filters change
  useEffect(() => {
    setOffset(0);
    fetchLogs(true);
  }, [options.search, options.category, options.type, options.days]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchLogs(false);
    }
  }, [loading, hasMore, fetchLogs]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
  };
}
