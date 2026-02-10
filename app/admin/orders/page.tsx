"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STATUSES = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "REFUNDED"] as const;
const SHIPMENT_STATUSES = ["PENDING", "PACKED", "SHIPPED", "DELIVERED", "RETURNED"] as const;
const REFUND_STATUSES = ["PENDING", "SUCCEEDED", "FAILED"] as const;

type OrderItem = {
  id: string;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPriceEur: number;
  totalEur: number;
};

type Refund = {
  id: string;
  amountMinor: number;
  status: string;
  reason?: string | null;
  createdAt?: string;
};

type Payment = {
  id: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  refunds?: Refund[];
};

type Shipment = {
  id: string;
  status: string;
  trackingNumber?: string | null;
  method: string;
};

type OrderEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  createdBy?: { email: string; name?: string | null } | null;
};

type Address = {
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

type Order = {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string | null;
  status: string;
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

const formatCurrency = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("");
  const [noteText, setNoteText] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    const url = `/api/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      setError("Failed to load orders.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrders(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, debouncedSearch]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (!selectedOrder) {
      setStatusUpdate("");
      setTrackingNumber("");
      setShipmentStatus("");
      setNoteText("");
      setRefundAmount("");
      setRefundReason("");
      setRefundPaymentId("");
      return;
    }

    setStatusUpdate(selectedOrder.status);
    setTrackingNumber(selectedOrder.shipments?.[0]?.trackingNumber || "");
    setShipmentStatus(selectedOrder.shipments?.[0]?.status || "");
    setRefundPaymentId(selectedOrder.payments?.[0]?.id || "");
  }, [selectedOrder]);

  const applyUpdates = async () => {
    if (!selectedOrder) return;
    setError(null);

    const payload = {
      status: statusUpdate,
      trackingNumber: trackingNumber || undefined,
      shipmentStatus: shipmentStatus || undefined,
    };

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Update failed.");
      return;
    }

    await loadOrders();
  };

  const submitNote = async () => {
    if (!selectedOrder || !noteText.trim()) return;
    setError(null);

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText.trim() }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Note failed.");
      return;
    }

    setNoteText("");
    await loadOrders();
  };

  const submitRefund = async () => {
    if (!selectedOrder) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Refund amount is required.");
      return;
    }

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refunds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        reason: refundReason || undefined,
        paymentId: refundPaymentId || undefined,
      }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Refund failed.");
      return;
    }

    setRefundAmount("");
    setRefundReason("");
    await loadOrders();
  };

  const updateRefundStatus = async (refundId: string, status: string) => {
    const res = await fetch(`/api/admin/refunds/${refundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Refund update failed.");
      return;
    }

    await loadOrders();
  };

  const refunds = selectedOrder
    ? selectedOrder.payments.flatMap((payment) => payment.refunds || [])
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Orders</h1>
          <p className="text-slate-400">Track purchases, payments, and fulfillment.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 px-4 py-3 pl-10 text-white focus:outline-none focus:border-gold"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-slate-900 border border-white/10 px-4 py-3 text-white"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4">
          <h2 className="font-bebas text-2xl">Recent Orders</h2>
          {loading ? (
            <p className="text-slate-400">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-slate-400">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left border border-white/10 p-4 transition ${
                    selectedOrderId === order.id ? "border-gold bg-slate-900/80" : "bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bebas text-xl">#{order.orderNumber}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{order.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">{order.status}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{order.items?.length ?? 0} items</span>
                    <span>•</span>
                    <span>{formatCurrency(order.totalMinor, order.currency)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="border border-white/10 bg-slate-900/60 p-6">
          <h2 className="font-bebas text-2xl mb-4">Order Details</h2>
          {!selectedOrder ? (
            <p className="text-slate-400">Select an order to view details.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-bebas text-xl">#{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-slate-400">{selectedOrder.email}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <select
                    value={statusUpdate}
                    onChange={(event) => setStatusUpdate(event.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shipment Status</p>
                  <select
                    value={shipmentStatus}
                    onChange={(event) => setShipmentStatus(event.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                  >
                    <option value="">Not set</option>
                    {SHIPMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tracking Number</p>
                  <input
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shipping Method</p>
                  <p className="mt-3 text-sm text-slate-300">{selectedOrder.shippingMethod}</p>
                </div>
              </div>

              <button
                onClick={applyUpdates}
                className="w-full bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider py-3 hover:bg-white transition-colors"
              >
                Save Updates
              </button>

              <div>
                <h4 className="font-bebas text-lg mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
                      <div>
                        <p>{item.productName}</p>
                        {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                      </div>
                      <div>
                        {item.quantity} ? EUR {item.unitPriceEur}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bebas text-lg mb-2">Payment</h4>
                {selectedOrder.payments.length === 0 ? (
                  <p className="text-sm text-slate-400">No payments recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.payments.map((payment) => (
                      <div key={payment.id} className="text-sm text-slate-300">
                        {payment.provider} · {payment.status} · {formatCurrency(payment.amountMinor, payment.currency)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bebas text-lg mb-2">Refunds</h4>
                {selectedOrder.payments.length === 0 ? (
                  <p className="text-sm text-slate-400">No payments available for refunds.</p>
                ) : (
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="number"
                        placeholder={`Amount (${selectedOrder.currency})`}
                        value={refundAmount}
                        onChange={(event) => setRefundAmount(event.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                      />
                      <input
                        placeholder="Reason (optional)"
                        value={refundReason}
                        onChange={(event) => setRefundReason(event.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                      />
                      <select
                        value={refundPaymentId}
                        onChange={(event) => setRefundPaymentId(event.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                      >
                        {selectedOrder.payments.map((payment) => (
                          <option key={payment.id} value={payment.id}>
                            {payment.provider} {formatCurrency(payment.amountMinor, payment.currency)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={submitRefund}
                      className="w-full bg-slate-800 text-white uppercase tracking-[0.2em] text-xs py-3 hover:bg-slate-700"
                    >
                      Create Refund
                    </button>
                  </div>
                )}

                {refunds.length === 0 ? (
                  <p className="text-sm text-slate-400 mt-4">No refunds yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {refunds.map((refund) => (
                      <div key={refund.id} className="border border-white/10 p-3 text-sm text-slate-300">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {formatCurrency(refund.amountMinor, selectedOrder.currency)} · {refund.status}
                          </span>
                          <select
                            value={refund.status}
                            onChange={(event) => updateRefundStatus(refund.id, event.target.value)}
                            className="bg-slate-950 border border-white/10 px-3 py-2 text-white"
                          >
                            {REFUND_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        {refund.reason && <p className="text-xs text-slate-500 mt-2">{refund.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bebas text-lg mb-2">Timeline</h4>
                {selectedOrder.events && selectedOrder.events.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.events.map((event) => (
                      <div key={event.id} className="border border-white/10 p-3 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{event.type}</p>
                        <p className="mt-1">{event.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(event.createdAt).toLocaleString()} · {event.createdBy?.email || "system"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No events yet.</p>
                )}

                <div className="mt-4 space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Add internal note"
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                    rows={3}
                  />
                  <button
                    onClick={submitNote}
                    className="w-full bg-slate-800 text-white uppercase tracking-[0.2em] text-xs py-3 hover:bg-slate-700"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bebas text-lg mb-2">Shipping Address</h4>
                {selectedOrder.shippingAddress ? (
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>{selectedOrder.shippingAddress.name}</p>
                    <p>{selectedOrder.shippingAddress.street1}</p>
                    {selectedOrder.shippingAddress.street2 && <p>{selectedOrder.shippingAddress.street2}</p>}
                    <p>
                      {selectedOrder.shippingAddress.city}
                      {selectedOrder.shippingAddress.region ? `, ${selectedOrder.shippingAddress.region}` : ""}
                    </p>
                    {selectedOrder.shippingAddress.postalCode && (
                      <p>{selectedOrder.shippingAddress.postalCode}</p>
                    )}
                    <p>{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.novaPostOfficeName && (
                      <p>Nova Post: {selectedOrder.shippingAddress.novaPostOfficeName}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No shipping address.</p>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-slate-800 text-white uppercase tracking-[0.2em] text-xs py-3 hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Order / Packing Slip
                </button>
              </div>

              {/* Print-only content */}
              <div className="hidden print:block print:mt-8">
                <PrintOrderView order={selectedOrder} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PrintOrderView({ order }: { order: Order }) {
  return (
    <div className="print:p-8">
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">OP17</h1>
            <p className="text-sm text-gray-600">Ukrainian Thunder</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">PACKING SLIP</h2>
            <p className="text-lg">Order #{order.orderNumber}</p>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-sm uppercase mb-2">Ship To:</h3>
          {order.shippingAddress ? (
            <div className="text-sm">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street1}</p>
              {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.novaPostOfficeName && (
                <p className="mt-1 text-gray-600">Nova Post: {order.shippingAddress.novaPostOfficeName}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No shipping address</p>
          )}
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase mb-2">Contact:</h3>
          <div className="text-sm">
            <p>{order.email}</p>
            {order.phone && <p>{order.phone}</p>}
          </div>
          <h3 className="font-bold text-sm uppercase mb-2 mt-4">Shipping Method:</h3>
          <p className="text-sm">{order.shippingMethod}</p>
          {order.shipments?.[0]?.trackingNumber && (
            <>
              <h3 className="font-bold text-sm uppercase mb-2 mt-4">Tracking:</h3>
              <p className="text-sm">{order.shipments[0].trackingNumber}</p>
            </>
          )}
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2">Item</th>
            <th className="text-left py-2">Variant</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-gray-600">{item.variantName || "—"}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">€{item.unitPriceEur.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-48">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>€{order.subtotalEur.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-300">
            <span>Shipping:</span>
            <span>€{(order.totalEur - order.subtotalEur).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>Total:</span>
            <span>€{order.totalEur.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>Thank you for your order!</p>
        <p className="mt-1">www.op17.com</p>
      </div>
    </div>
  );
}

