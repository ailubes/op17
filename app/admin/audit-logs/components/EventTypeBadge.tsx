import { AdminEventType } from "@prisma/client";

const EVENT_TYPE_CONFIG: Record<
  AdminEventType,
  { label: string; color: string; category: string }
> = {
  // User management
  USER_CREATED: { label: "User Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "users" },
  USER_UPDATED: { label: "User Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "users" },
  USER_ROLES_UPDATED: { label: "Roles Changed", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", category: "users" },
  USER_DEACTIVATED: { label: "User Deactivated", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "users" },
  USER_REACTIVATED: { label: "User Reactivated", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "users" },
  USER_PASSWORD_RESET_LINK: { label: "Reset Link", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", category: "users" },
  USER_INVITE_LINK: { label: "Invite Link", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", category: "users" },
  USER_LOGIN: { label: "Login", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", category: "users" },
  USER_LOGOUT: { label: "Logout", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", category: "users" },

  // Products
  PRODUCT_CREATED: { label: "Product Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "products" },
  PRODUCT_UPDATED: { label: "Product Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "products" },
  PRODUCT_DELETED: { label: "Product Deleted", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "products" },

  // Variants
  VARIANT_CREATED: { label: "Variant Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "products" },
  VARIANT_UPDATED: { label: "Variant Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "products" },
  VARIANT_DELETED: { label: "Variant Deleted", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "products" },
  VARIANT_STOCK_UPDATED: { label: "Stock Updated", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", category: "products" },

  // Orders
  ORDER_STATUS_UPDATED: { label: "Status Changed", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "orders" },
  ORDER_TRACKING_ADDED: { label: "Tracking Added", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", category: "orders" },
  ORDER_NOTE_ADDED: { label: "Note Added", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", category: "orders" },

  // Refunds
  REFUND_CREATED: { label: "Refund Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "orders" },
  REFUND_UPDATED: { label: "Refund Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "orders" },

  // Categories
  CATEGORY_CREATED: { label: "Category Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "products" },
  CATEGORY_UPDATED: { label: "Category Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "products" },
  CATEGORY_DELETED: { label: "Category Deleted", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "products" },

  // Collections
  COLLECTION_CREATED: { label: "Collection Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "products" },
  COLLECTION_UPDATED: { label: "Collection Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "products" },
  COLLECTION_DELETED: { label: "Collection Deleted", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "products" },

  // Promo codes
  PROMO_CODE_CREATED: { label: "Promo Created", color: "bg-green-500/10 text-green-500 border-green-500/20", category: "products" },
  PROMO_CODE_UPDATED: { label: "Promo Updated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", category: "products" },
  PROMO_CODE_DELETED: { label: "Promo Deleted", color: "bg-red-500/10 text-red-500 border-red-500/20", category: "products" },
};

interface EventTypeBadgeProps {
  type: AdminEventType | string;
  size?: "sm" | "md";
}

export function EventTypeBadge({ type, size = "sm" }: EventTypeBadgeProps) {
  const config = EVENT_TYPE_CONFIG[type as AdminEventType] ?? {
    label: type.replace(/_/g, " "),
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    category: "other",
  };

  const sizeClasses = size === "sm"
    ? "text-xs px-2 py-0.5"
    : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded border ${config.color} ${sizeClasses} font-medium uppercase tracking-wider whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
}

export function getEventCategory(type: AdminEventType | string): string {
  return EVENT_TYPE_CONFIG[type as AdminEventType]?.category || "other";
}
