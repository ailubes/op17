import { OrderStatus, Order } from "./types";

export const formatCurrency = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export type StatusColor = { bg: string; text: string; border: string; dot?: string };

export const getStatusColor = (status: OrderStatus | string): StatusColor => {
  const colors: Record<string, StatusColor> = {
    PENDING: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      dot: "bg-yellow-400",
    },
    PAID: {
      bg: "bg-green-500",
      text: "text-white",
      border: "border-green-500",
    },
    FULFILLED: {
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-blue-500",
    },
    SHIPPED: {
      bg: "bg-purple-500",
      text: "text-white",
      border: "border-purple-500",
    },
    DELIVERED: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/30",
      dot: "bg-green-400",
    },
    REFUNDED: {
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-500",
    },
    CANCELLED: {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/30",
      dot: "bg-slate-400",
    },
  };
  return colors[status] || colors.PENDING;
};

export const getStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

export const getOrderSummary = (order: Order): string => {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${itemCount} item${itemCount !== 1 ? "s" : ""}`;
};

export const getTotalRefunded = (order: Order): number => {
  return order.payments.reduce((total, payment) => {
    const paymentRefunds = payment.refunds?.filter(r => r.status === "SUCCEEDED") || [];
    return total + paymentRefunds.reduce((sum, r) => sum + r.amountMinor, 0);
  }, 0);
};

export const canRefund = (order: Order): boolean => {
  const totalPaid = order.payments
    .filter(p => p.status === "succeeded" || p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const totalRefunded = getTotalRefunded(order);
  return totalRefunded < totalPaid && ["PAID", "FULFILLED", "SHIPPED"].includes(order.status);
};

export const canMarkAsPaid = (order: Order): boolean => order.status === "PENDING";
export const canMarkAsShipped = (order: Order): boolean => ["PAID", "FULFILLED"].includes(order.status);
export const canAddTracking = (order: Order): boolean => ["PAID", "FULFILLED", "SHIPPED"].includes(order.status);
