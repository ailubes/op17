"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  OrderList,
  FilterChips,
  OrderDetailMobile,
  OrderDetailDesktop,
  StatusBadge,
} from "./components";
import { useOrders, useOrderActions } from "./hooks";
import { Order, OrderStatus, ShipmentStatus, FilterOption } from "./types";
import { formatCurrency } from "./utils";
import { toastSuccess } from "@/components/admin";

// Print view component
function PrintOrderView({ order }: { order: Order }) {
  return (
    <div className="hidden print:block print:p-8">
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

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { orders, loading, error, refresh, counts } = useOrders({
    statusFilter,
    searchQuery: debouncedSearch,
  });

  const {
    updateStatus,
    updateShipment,
    addNote,
    createRefund,
    updateRefundStatus,
  } = useOrderActions({ onSuccess: refresh });

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsMobileDetailOpen(true);
  };

  const handleCloseMobileDetail = () => {
    setIsMobileDetailOpen(false);
    // Delay clearing selected order to allow animation
    setTimeout(() => setSelectedOrderId(null), 300);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build filter options with counts
  const filterOptions: FilterOption[] = [
    { value: "all", label: "All", count: counts.all || 0 },
    { value: "PENDING", label: "Pending", count: counts.PENDING || 0 },
    { value: "PAID", label: "Paid", count: counts.PAID || 0 },
    { value: "FULFILLED", label: "Fulfilled", count: counts.FULFILLED || 0 },
    { value: "SHIPPED", label: "Shipped", count: counts.SHIPPED || 0 },
    { value: "REFUNDED", label: "Refunded", count: counts.REFUNDED || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl sm:text-5xl">Orders</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Track purchases, payments, and fulfillment.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors"
        >
          Back to Admin
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-500"
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
          </div>
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 pl-12 pr-4 py-3.5 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all min-h-[48px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <FilterChips
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content - Desktop: Two Column, Mobile: One Column with Bottom Sheet */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px]">
        {/* Orders List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl text-slate-300">Orders</h2>
            {!loading && (
              <span className="text-sm text-slate-500">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            )}
          </div>
          <OrderList
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={handleSelectOrder}
            loading={loading}
            emptyMessage={
              debouncedSearch
                ? `No orders found for "${debouncedSearch}"`
                : statusFilter !== "all"
                ? `No ${statusFilter.toLowerCase()} orders`
                : "No orders yet."
            }
          />
        </section>

        {/* Desktop: Order Detail Side Panel */}
        <section className="hidden lg:block">
          <OrderDetailDesktop
            order={selectedOrder}
            onUpdateStatus={(status) => selectedOrder && updateStatus(selectedOrder.id, status)}
            onUpdateShipment={(tracking, status) =>
              selectedOrder && updateShipment(selectedOrder.id, tracking, status)
            }
            onAddNote={(note) => selectedOrder && addNote(selectedOrder.id, note)}
            onCreateRefund={(amount, reason, paymentId) =>
              selectedOrder && createRefund(selectedOrder.id, amount, reason, paymentId)
            }
            onUpdateRefundStatus={updateRefundStatus}
            onPrint={handlePrint}
          />
        </section>
      </div>

      {/* Mobile: Order Detail Bottom Sheet */}
      <OrderDetailMobile
        order={selectedOrder}
        isOpen={isMobileDetailOpen}
        onClose={handleCloseMobileDetail}
        onUpdateStatus={(status) => selectedOrder && updateStatus(selectedOrder.id, status)}
        onUpdateShipment={(tracking, status) =>
          selectedOrder && updateShipment(selectedOrder.id, tracking, status)
        }
        onAddNote={(note) => selectedOrder && addNote(selectedOrder.id, note)}
        onCreateRefund={(amount, reason, paymentId) =>
          selectedOrder && createRefund(selectedOrder.id, amount, reason, paymentId)
        }
        onUpdateRefundStatus={updateRefundStatus}
        onPrint={handlePrint}
      />

      {/* Print View (hidden) */}
      {selectedOrder && (
        <div className="hidden print:block">
          <PrintOrderView order={selectedOrder} />
        </div>
      )}
    </div>
  );
}
