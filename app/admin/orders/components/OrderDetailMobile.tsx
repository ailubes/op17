"use client";

import { useState } from "react";
import { Order, OrderStatus, ShipmentStatus } from "../types";
import { BottomSheet } from "./BottomSheet";
import { StatusBadge } from "./StatusBadge";
import { QuickActions } from "./QuickActions";
import { CollapsibleSection } from "./CollapsibleSection";
import { CopyButton } from "./CopyButton";
import { QuickActionButton } from "./QuickActionButton";
import {
  formatCurrency,
  formatDateTime,
  getOrderSummary,
  getTotalRefunded,
  canRefund,
} from "../utils";

interface OrderDetailMobileProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
  onUpdateShipment: (trackingNumber: string, status: ShipmentStatus) => void;
  onAddNote: (note: string) => void;
  onCreateRefund: (amount: number, reason: string, paymentId: string) => void;
  onUpdateRefundStatus: (refundId: string, status: string) => void;
  onPrint: () => void;
}

export function OrderDetailMobile({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateShipment,
  onAddNote,
  onCreateRefund,
  onUpdateRefundStatus,
  onPrint,
}: OrderDetailMobileProps) {
  const [noteText, setNoteText] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("PENDING");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  if (!order) return null;

  const refunds = order.payments.flatMap((p) => p.refunds || []);
  const totalRefunded = getTotalRefunded(order);
  const canCreateRefund = canRefund(order);

  const handleMarkPaid = () => onUpdateStatus("PAID");
  const handleMarkShipped = () => onUpdateStatus("SHIPPED");

  const handleSaveTracking = () => {
    onUpdateShipment(trackingNumber, shipmentStatus);
    setShowTrackingForm(false);
  };

  const handleCreateRefund = () => {
    const amount = Number(refundAmount);
    if (amount > 0 && order.payments[0]) {
      onCreateRefund(amount, refundReason, order.payments[0].id);
      setRefundAmount("");
      setRefundReason("");
      setShowRefundForm(false);
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText("");
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="92vh">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bebas text-2xl text-white tracking-wide">
            #{order.orderNumber}
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} size="md" />
          <span className="text-lg font-medium text-white">
            {formatCurrency(order.totalMinor, order.currency)}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{formatDateTime(order.createdAt)}</p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-white/10">
        <QuickActions
          order={order}
          onMarkPaid={order.status === "PENDING" ? handleMarkPaid : undefined}
          onMarkShipped={["PAID", "FULFILLED"].includes(order.status) ? handleMarkShipped : undefined}
          onAddTracking={["PAID", "FULFILLED", "SHIPPED"].includes(order.status) ? () => setShowTrackingForm(true) : undefined}
          onCreateRefund={canCreateRefund ? () => setShowRefundForm(true) : undefined}
          onPrint={onPrint}
          size="sm"
        />
      </div>

      {/* Tracking Form */}
      {showTrackingForm && (
        <div className="px-4 py-3 bg-slate-900/50 border-b border-white/10">
          <p className="text-sm font-medium text-slate-300 mb-2">Update Tracking</p>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white rounded-lg mb-2 focus:outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            <QuickActionButton variant="primary" size="sm" onClick={handleSaveTracking}>
              Save
            </QuickActionButton>
            <QuickActionButton variant="ghost" size="sm" onClick={() => setShowTrackingForm(false)}>
              Cancel
            </QuickActionButton>
          </div>
        </div>
      )}

      {/* Refund Form */}
      {showRefundForm && (
        <div className="px-4 py-3 bg-slate-900/50 border-b border-white/10">
          <p className="text-sm font-medium text-slate-300 mb-2">Create Refund</p>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder={`Amount (${order.currency})`}
            className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white rounded-lg mb-2 focus:outline-none focus:border-gold"
          />
          <input
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white rounded-lg mb-2 focus:outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            <QuickActionButton variant="danger" size="sm" onClick={handleCreateRefund}>
              Refund
            </QuickActionButton>
            <QuickActionButton variant="ghost" size="sm" onClick={() => setShowRefundForm(false)}>
              Cancel
            </QuickActionButton>
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      <div>
        {/* Customer Info */}
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
                <p className="text-sm text-slate-400">
                  {formatCurrency(payment.amountMinor, payment.currency)}
                </p>
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

        {/* Shipping */}
        <CollapsibleSection title="Shipping" defaultExpanded={false}>
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
        {refunds.length > 0 && (
          <CollapsibleSection title="Refunds" defaultExpanded={false}>
            <div className="space-y-3">
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
        )}

        {/* Timeline */}
        <CollapsibleSection title="Timeline" defaultExpanded={false}>
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

            {/* Add Note */}
            <div className="pt-2 border-t border-white/10">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add internal note..."
                rows={2}
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
    </BottomSheet>
  );
}
