"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/admin";
import { EventTypeBadge } from "./components/EventTypeBadge";
import { useAuditLogs, type AuditLog } from "./hooks/useAuditLogs";

const tabs = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "orders", label: "Orders" },
  { value: "products", label: "Products" },
];

export default function AuditLogsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState(7);

  const { logs, loading, error, hasMore, loadMore } = useAuditLogs({
    search: search || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    days: daysFilter,
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        const hasAdminRole = data.user?.roles?.some((r: string) => r === "ADMIN");
        setIsAdmin(hasAdminRole);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="font-bebas text-3xl mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">Only administrators can view audit logs.</p>
        <Link
          href="/admin"
          className="inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white transition-colors"
        >
          Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl sm:text-5xl">Audit Logs</h1>
        <p className="text-slate-400 mt-1">Track all admin actions across the system</p>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by actor email..."
        filters={[
          {
            value: categoryFilter,
            options: tabs.map((t) => ({ value: t.value, label: t.label })),
            onChange: setCategoryFilter,
          },
        ]}
        actions={
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-gold"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      )}

      {/* Logs List */}
      {!loading && !error && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No audit logs found for the selected period
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <AuditLogCard key={log.id} log={log} />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 border border-white/10 text-white font-barlow uppercase tracking-wider text-sm rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface AuditLogCardProps {
  log: AuditLog;
}

function AuditLogCard({ log }: AuditLogCardProps) {
  const formattedTime = new Date(log.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const actorName = log.actor?.name || log.actor?.email || "Unknown";
  const targetName = log.targetUser?.name || log.targetUser?.email;

  return (
    <div className="p-4 bg-slate-900/60 border border-white/10 rounded-lg space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{actorName}</p>
            {log.actor?.email && log.actor.email !== actorName && (
              <p className="text-xs text-slate-500">{log.actor.email}</p>
            )}
          </div>
        </div>
        <EventTypeBadge type={log.type} />
      </div>

      {/* Description */}
      <div className="pl-11">
        <p className="text-slate-300">{getLogDescription(log)}</p>

        {/* Metadata */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="mt-2 p-2 bg-slate-800/50 rounded text-sm">
            <LogMetadata metadata={log.metadata} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pl-11 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span>{formattedTime}</span>
        {log.ip && <span>IP: {log.ip}</span>}
        {targetName && <span>Target: {targetName}</span>}
      </div>
    </div>
  );
}

function getLogDescription(log: AuditLog): string {
  const type = log.type;
  const metadata = (log.metadata || {}) as Record<string, unknown>;

  switch (type) {
    case "USER_CREATED":
      return `Created user ${(metadata.email as string) || ""}`;
    case "USER_UPDATED":
      return `Updated user details`;
    case "USER_ROLES_UPDATED": {
      const oldRoles = (metadata.oldRoles as string[]) || [];
      const newRoles = (metadata.newRoles as string[]) || [];
      return `Changed roles from ${oldRoles.join(", ") || "none"} to ${newRoles.join(", ") || "none"}`;
    }
    case "USER_DEACTIVATED":
      return "Deactivated user account";
    case "USER_REACTIVATED":
      return "Reactivated user account";
    case "USER_PASSWORD_RESET_LINK":
      return "Generated password reset link";
    case "USER_INVITE_LINK":
      return "Generated invite link";
    case "USER_LOGIN":
      return "Logged in";
    case "USER_LOGOUT":
      return "Logged out";

    case "PRODUCT_CREATED":
      return `Created product "${(metadata.productName as string) || ""}"`;
    case "PRODUCT_UPDATED":
      return `Updated product "${(metadata.productName as string) || ""}"`;
    case "PRODUCT_DELETED":
      return `Deleted product "${(metadata.productName as string) || ""}"`;

    case "VARIANT_CREATED":
      return `Created variant SKU: ${(metadata.sku as string) || ""}`;
    case "VARIANT_UPDATED":
      return `Updated variant SKU: ${(metadata.sku as string) || ""}`;
    case "VARIANT_DELETED":
      return `Deleted variant SKU: ${(metadata.sku as string) || ""}`;
    case "VARIANT_STOCK_UPDATED":
      return `Updated stock for ${(metadata.sku as string) || ""}: ${metadata.oldStock} → ${metadata.newStock}`;

    case "ORDER_STATUS_UPDATED":
      return `Updated order ${(metadata.orderNumber as string) || ""} status: ${metadata.oldStatus} → ${metadata.newStatus}`;
    case "ORDER_TRACKING_ADDED":
      return `Added tracking to order ${(metadata.orderNumber as string) || ""}: ${(metadata.trackingNumber as string) || ""}`;
    case "ORDER_NOTE_ADDED":
      return `Added note to order ${(metadata.orderNumber as string) || ""}`;

    case "REFUND_CREATED": {
      const amount = (metadata.amount as number) || 0;
      return `Created refund for order ${(metadata.orderNumber as string) || ""}: ${amount / 100} ${(metadata.currency as string) || ""}`;
    }
    case "REFUND_UPDATED": {
      const changes = (metadata.changes as Record<string, { from: string; to: string }>) || {};
      return `Updated refund status: ${changes.status?.from || ""} → ${changes.status?.to || ""}`;
    }

    case "CATEGORY_CREATED":
      return `Created category "${(metadata.categoryName as string) || ""}"`;
    case "CATEGORY_UPDATED":
      return `Updated category "${(metadata.categoryName as string) || ""}"`;
    case "CATEGORY_DELETED":
      return `Deleted category "${(metadata.categoryName as string) || ""}"`;

    case "COLLECTION_CREATED":
      return `Created collection "${(metadata.collectionName as string) || ""}"`;
    case "COLLECTION_UPDATED":
      return `Updated collection "${(metadata.collectionName as string) || ""}"`;
    case "COLLECTION_DELETED":
      return `Deleted collection "${(metadata.collectionName as string) || ""}"`;

    case "PROMO_CODE_CREATED":
      return `Created promo code "${(metadata.code as string) || ""}"`;
    case "PROMO_CODE_UPDATED":
      return `Updated promo code "${(metadata.code as string) || ""}"`;
    case "PROMO_CODE_DELETED":
      return `Deleted promo code "${(metadata.code as string) || ""}"`;

    default:
      return (type as string).replace(/_/g, " ").toLowerCase();
  }
}

function LogMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  // Filter out internal IDs and focus on meaningful changes
  const displayKeys = Object.keys(metadata).filter(
    (key) => !["productId", "variantId", "orderId", "categoryId", "collectionId", "promoCodeId", "refundId", "paymentId"].includes(key)
  );

  if (displayKeys.length === 0) return null;

  return (
    <div className="space-y-1">
      {displayKeys.map((key) => {
        const value = metadata[key];
        if (typeof value === "object" && value !== null) {
          // Handle change objects (from/to)
          if ("from" in value && "to" in value) {
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-slate-500">{key}:</span>
                <span className="text-red-400 line-through">{String(value.from) || "null"}</span>
                <span className="text-slate-600">→</span>
                <span className="text-green-400">{String(value.to) || "null"}</span>
              </div>
            );
          }
          return (
            <div key={key} className="text-slate-500">
              {key}: {JSON.stringify(value)}
            </div>
          );
        }
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-slate-500">{key}:</span>
            <span className="text-slate-300">{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
