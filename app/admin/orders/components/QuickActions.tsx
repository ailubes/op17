"use client";

import { Order } from "../types";
import { QuickActionButton } from "./QuickActionButton";
import {
  canMarkAsPaid,
  canMarkAsShipped,
  canAddTracking,
  canRefund,
} from "../utils";

interface QuickActionsProps {
  order: Order;
  onMarkPaid?: () => void;
  onMarkShipped?: () => void;
  onAddTracking?: () => void;
  onCreateRefund?: () => void;
  onPrint?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export function QuickActions({
  order,
  onMarkPaid,
  onMarkShipped,
  onAddTracking,
  onCreateRefund,
  onPrint,
  className = "",
  size = "md",
}: QuickActionsProps) {
  const showMarkPaid = canMarkAsPaid(order) && onMarkPaid;
  const showMarkShipped = canMarkAsShipped(order) && onMarkShipped;
  const showAddTracking = canAddTracking(order) && onAddTracking;
  const showRefund = canRefund(order) && onCreateRefund;
  const showPrint = onPrint;

  const hasActions =
    showMarkPaid || showMarkShipped || showAddTracking || showRefund || showPrint;

  if (!hasActions) {
    return (
      <div className={`p-4 bg-slate-800/30 rounded-lg text-center ${className}`}>
        <p className="text-sm text-slate-500">No quick actions available</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showMarkPaid && (
        <QuickActionButton
          onClick={onMarkPaid}
          variant="primary"
          size={size}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          Mark Paid
        </QuickActionButton>
      )}

      {showMarkShipped && (
        <QuickActionButton
          onClick={onMarkShipped}
          variant="primary"
          size={size}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          Mark Shipped
        </QuickActionButton>
      )}

      {showAddTracking && (
        <QuickActionButton
          onClick={onAddTracking}
          variant="secondary"
          size={size}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        >
          Add Tracking
        </QuickActionButton>
      )}

      {showRefund && (
        <QuickActionButton
          onClick={onCreateRefund}
          variant="danger"
          size={size}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          }
        >
          Refund
        </QuickActionButton>
      )}

      {showPrint && (
        <QuickActionButton
          onClick={onPrint}
          variant="ghost"
          size={size}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          }
        >
          Print
        </QuickActionButton>
      )}
    </div>
  );
}
