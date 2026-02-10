export const STATUSES = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "REFUNDED", "CANCELLED"] as const;
export const SHIPMENT_STATUSES = ["PENDING", "PACKED", "SHIPPED", "DELIVERED", "RETURNED"] as const;
export const REFUND_STATUSES = ["PENDING", "SUCCEEDED", "FAILED"] as const;

export type OrderStatus = (typeof STATUSES)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export type OrderItem = {
  id: string;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPriceEur: number;
  totalEur: number;
};

export type Refund = {
  id: string;
  amountMinor: number;
  status: RefundStatus;
  reason?: string | null;
  createdAt?: string;
};

export type Payment = {
  id: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  refunds?: Refund[];
};

export type Shipment = {
  id: string;
  status: ShipmentStatus;
  trackingNumber?: string | null;
  method: string;
};

export type OrderEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  createdBy?: { email: string; name?: string | null } | null;
};

export type Address = {
  name: string;
  phone?: string | null;
  country: string;
  region?: string | null;
  city: string;
  postalCode?: string | null;
  street1: string;
  street2?: string | null;
  novaPostOfficeName?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string | null;
  status: OrderStatus;
  currency: string;
  totalMinor: number;
  subtotalEur: number;
  totalEur: number;
  createdAt: string;
  shippingMethod: string;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  events?: OrderEvent[];
  shippingAddress?: Address | null;
};

export type FilterOption = {
  value: string;
  label: string;
  count?: number;
};
