"use client";

import { useState, useCallback } from "react";
import { OrderStatus, ShipmentStatus } from "../types";
import { toastSuccess, toastError } from "@/components/admin";

interface UseOrderActionsOptions {
  onSuccess?: () => void;
}

interface UseOrderActionsReturn {
  updating: boolean;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  updateShipment: (
    orderId: string,
    trackingNumber: string,
    status: ShipmentStatus
  ) => Promise<boolean>;
  addNote: (orderId: string, note: string) => Promise<boolean>;
  createRefund: (
    orderId: string,
    amount: number,
    reason: string,
    paymentId: string
  ) => Promise<boolean>;
  updateRefundStatus: (
    refundId: string,
    status: string
  ) => Promise<boolean>;
}

export function useOrderActions(
  options: UseOrderActionsOptions = {}
): UseOrderActionsReturn {
  const { onSuccess } = options;
  const [updating, setUpdating] = useState(false);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toastError(data?.error || "Failed to update status");
          return false;
        }

        toastSuccess(`Order status updated to ${status}`);
        handleSuccess();
        return true;
      } catch (err) {
        toastError("Failed to update status");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [handleSuccess]
  );

  const updateShipment = useCallback(
    async (
      orderId: string,
      trackingNumber: string,
      status: ShipmentStatus
    ): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber: trackingNumber || undefined,
            shipmentStatus: status,
          }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toastError(data?.error || "Failed to update shipment");
          return false;
        }

        toastSuccess("Shipment information updated");
        handleSuccess();
        return true;
      } catch (err) {
        toastError("Failed to update shipment");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [handleSuccess]
  );

  const addNote = useCallback(
    async (orderId: string, note: string): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toastError(data?.error || "Failed to add note");
          return false;
        }

        toastSuccess("Note added");
        handleSuccess();
        return true;
      } catch (err) {
        toastError("Failed to add note");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [handleSuccess]
  );

  const createRefund = useCallback(
    async (
      orderId: string,
      amount: number,
      reason: string,
      paymentId: string
    ): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/refunds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: reason || undefined,
            paymentId: paymentId || undefined,
          }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toastError(data?.error || "Failed to create refund");
          return false;
        }

        toastSuccess("Refund created");
        handleSuccess();
        return true;
      } catch (err) {
        toastError("Failed to create refund");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [handleSuccess]
  );

  const updateRefundStatus = useCallback(
    async (refundId: string, status: string): Promise<boolean> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/refunds/${refundId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toastError(data?.error || "Failed to update refund");
          return false;
        }

        toastSuccess("Refund status updated");
        handleSuccess();
        return true;
      } catch (err) {
        toastError("Failed to update refund");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [handleSuccess]
  );

  return {
    updating,
    updateStatus,
    updateShipment,
    addNote,
    createRefund,
    updateRefundStatus,
  };
}
