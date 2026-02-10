"use client";

import { useState } from "react";
import { Order, OrderStatus, ShipmentStatus, STATUSES, SHIPMENT_STATUSES } from "../types";
import { StatusBadge } from "./StatusBadge";
import { QuickActions } from "./QuickActions";
import { CollapsibleSection } from "./CollapsibleSection";
import { CopyButton } from "./CopyButton";
import { QuickActionButton } from "./QuickActionButton";
import {
  formatCurrency,
  formatDateTime,
  getTotalRefunded,
  canRefund,
} from "../utils";

interface OrderDetailDesktopProps {
  order: Order | null;
  onUpdateStatus: (status: OrderStatus) => void;
  onUpdateShipment: (trackingNumber: string, status: ShipmentStatus) => void;
  onAddNote: (note: string) => void;
  onCreateRefund: (amount: number, reason: string, paymentId: string) => void;
  onUpdateRefundStatus: (refundId: string, status: string) => void;
  onPrint: () => void;
}

export function OrderDetailDesktop({
  order,
  onUpdateStatus,
  onUpdateShipment,
  onAddNote,
  onCreateRefund,
  onUpdateRefundStatus,
  onPrint,
}: OrderDetailDesktopProps) {
  const [noteText, setNoteText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState<OrderStatus>("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("PENDING");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState("");

  if (!order) {
    return (
      <div className="border border-white/10 bg-slate-900/60 p-6 rounded-lg h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500">Select an order to view details.</p>
        </div>
      </div>
    );
  }

  // Initialize form values when order changes
  if (statusUpdate !== order.status) {
    setStatusUpdate(order.status);
  }
  if (trackingNumber !== (order.shipments?.[0]?.trackingNumber || "")) {
    setTrackingNumber(order.shipments?.[0]?.trackingNumber || "");
  }
  if (shipmentStatus !== (order.shipments?.[0]?.status as ShipmentStatus || "PENDING")) {
    setShipmentStatus(order.shipments?.[0]?.status as ShipmentStatus || "PENDING");
  }
  if (!refundPaymentId && order.payments?.[0]?.id) {
    setRefundPaymentId(order.payments[0].id);
  }

  const refunds = order.payments.flatMap((p) => p.refunds || []);
  const totalRefunded = getTotalRefunded(order);
  const canCreateRefund = canRefund(order);

  const handleMarkPaid = () => onUpdateStatus("PAID");
  const handleMarkShipped = () => onUpdateStatus("SHIPPED");

  const handleApplyUpdates = () => {
    onUpdateShipment(trackingNumber, shipmentStatus);
  };

  const handleCreateRefund = () => {
    const amount = Number(refundAmount);
    if (amount > 0 && refundPaymentId) {
      onCreateRefund(amount, refundReason, refundPaymentId);
      setRefundAmount("");
      setRefundReason("");
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText("");
    }
  };

  return (
    <div className="border border-white/10 bg-slate-900/60 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bebas text-3xl text-white tracking-wide">#{order.orderNumber}</h2>
            <p className="text-sm text-slate-400 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} size="lg" />
        </div>

        <QuickActions
          order={order}
          onMarkPaid={order.status === "PENDING" ? handleMarkPaid : undefined}
          onMarkShipped={["PAID", "FULFILLED"].includes(order.status) ? handleMarkShipped : undefined}
          onPrint={onPrint}
        />
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Status & Shipment */}
        <CollapsibleSection title="Status & Shipment" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                  Order Status
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => {
                    setStatusUpdate(e.target.value as OrderStatus);
                    onUpdateStatus(e.target.value as OrderStatus);
                  }}
                  className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white rounded-lg focus:outline-none focus:border-gold"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                  Shipment Status
                </label>
                <select
                  value={shipmentStatus}
                  onChange={(e) => setShipmentStatus(e.target.value as ShipmentStatus)}
                  className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white rounded-lg focus:outline-none focus:border-gold"
                >
                  {SHIPMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                Tracking Number
              </label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white rounded-lg focus:outline-none focus:border-gold"
              />
            </div>

            <QuickActionButton onClick={handleApplyUpdates} variant="primary" className="w-full">
              Save Updates
            </QuickActionButton>
          </div>
        </CollapsibleSection>

        {/* Customer */}
        <CollapsibleSection title="Customer" defaultExpanded={true}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Email</span>
              <CopyButton text={order.email} />
            </div>
            <p className="text-sm text-slate-200">{order.email}</p>
            {order.phone && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Phone</span>
                  <CopyButton text={order.phone} />
                </div>
                <p className="text-sm text-slate-200">{order.phone}</p>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Items */}
        <CollapsibleSection title="Items" defaultExpanded={true}>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-200">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-200">{item.quantity} × €{item.unitPriceEur}</p>
                  <p className="text-xs text-slate-500">€{item.totalEur.toFixed(2)}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200">€{order.subtotalEur.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Shipping</span>
                <span className="text-slate-200">€{(order.totalEur - order.subtotalEur).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium mt-2 pt-2 border-t border-white/10">
                <span className="text-slate-300">Total</span>
                <span className="text-gold">{formatCurrency(order.totalMinor, order.currency)}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Payment */}
        <CollapsibleSection title="Payment" defaultExpanded={false}>
          <div className="space-y-3">
            {order.payments.map((payment) => (
              <div key={payment.id} className="p-3 bg-slate-950/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">{payment.provider}</span>
                  <StatusBadge status={payment.status} size="sm" />
                </div>
                <p className="text-sm text-slate-400">{formatCurrency(payment.amountMinor, payment.currency)}</p>
              </div>
            ))}
            {totalRefunded > 0 && (
              <div className="flex justify-between text-sm text-red-400 pt-2 border-t border-white/10">
                <span>Total Refunded</span>
                <span>{formatCurrency(totalRefunded, order.currency)}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Shipping Address */}
        <CollapsibleSection title="Shipping Address" defaultExpanded={false}>
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500">Method</span>
              <p className="text-sm text-slate-200 mt-1">{order.shippingMethod}</p>
            </div>
            {order.shipments[0]?.trackingNumber && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-500">Tracking</span>
                  <CopyButton text={order.shipments[0].trackingNumber} />
                </div>
                <p className="text-sm text-slate-200 mt-1">{order.shipments[0].trackingNumber}</p>
              </div>
            )}
            {order.shippingAddress && (
              <div className="p-3 bg-slate-950/50 rounded-lg text-sm text-slate-300 space-y-1">
                <p className="font-medium text-slate-200">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street1}</p>
                {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.region && `, ${order.shippingAddress.region}`}
                </p>
                {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.novaPostOfficeName && (
                  <p className="text-slate-400">Nova Post: {order.shippingAddress.novaPostOfficeName}</p>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Refunds */}
        {canCreateRefund || refunds.length > 0 ? (
          <CollapsibleSection title="Refunds" defaultExpanded={false}>
            <div className="space-y-3">
              {canCreateRefund && (
                <div className="p-3 bg-slate-950/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-slate-300">Create Refund</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={`Amount (${order.currency})`}
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-gold"
                    />
                    <input
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason"
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-gold"
                    />
                    <select
                      value={refundPaymentId}
                      onChange={(e) => setRefundPaymentId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white rounded-lg"
                    >
                      {order.payments.map((payment) => (
                        <option key={payment.id} value={payment.id}>
                          {payment.provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  <QuickActionButton
                    variant="danger"
                    size="sm"
                    onClick={handleCreateRefund}
                    disabled={!refundAmount || Number(refundAmount) <= 0}
                    className="w-full"
                  >
                    Create Refund
                  </QuickActionButton>
                </div>
              )}

              {refunds.map((refund) => (
                <div key={refund.id} className="p-3 bg-slate-950/50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-300">
                      {formatCurrency(refund.amountMinor, order.currency)}
                    </span>
                    <select
                      value={refund.status}
                      onChange={(e) => onUpdateRefundStatus(refund.id, e.target.value)}
                      className="bg-slate-800 border border-white/10 px-2 py-1 text-xs text-white rounded"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="SUCCEEDED">Succeeded</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                  {refund.reason && <p className="text-xs text-slate-500">{refund.reason}</p>}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Timeline */}
        <CollapsibleSection title="Timeline & Notes" defaultExpanded={false}>
          <div className="space-y-3">
            {order.events && order.events.length > 0 ? (
              order.events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <div className="w-px flex-1 bg-white/10 my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">{event.type}</p>
                    <p className="text-sm text-slate-300 mt-0.5">{event.message}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatDateTime(event.createdAt)} · {event.createdBy?.email || "system"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No events yet.</p>
            )}

            <div className="pt-2 border-t border-white/10">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add internal note..."
                rows={3}
                className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-gold resize-none"
              />
              <QuickActionButton
                variant="secondary"
                size="sm"
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="mt-2 w-full"
              >
                Add Note
              </QuickActionButton>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
