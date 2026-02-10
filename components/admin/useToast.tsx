"use client";

import { useCallback, useState } from "react";
import { ToastContainer, ToastType } from "./Toast";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

let toastListeners: ((toast: { message: string; type: ToastType; duration: number }) => void)[] = [];

export function toast(options: ToastOptions) {
  const { message, type = "info", duration = 5000 } = options;
  toastListeners.forEach((listener) => listener({ message, type, duration }));
}

export function toastSuccess(message: string, duration?: number) {
  toast({ message, type: "success", duration });
}

export function toastError(message: string, duration?: number) {
  toast({ message, type: "error", duration });
}

export function toastWarning(message: string, duration?: number) {
  toast({ message, type: "warning", duration });
}

export function toastInfo(message: string, duration?: number) {
  toast({ message, type: "info", duration });
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = {
      id,
      message: options.message,
      type: options.type || "info",
      duration: options.duration || 5000,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "success", duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "error", duration });
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "warning", duration });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "info", duration });
  }, [addToast]);

  const ToastComponent = (
    <ToastContainer toasts={toasts} onRemove={removeToast} />
  );

  return {
    toast: addToast,
    success,
    error,
    warning,
    info,
    ToastComponent,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: { message: string; type: ToastType; duration: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register with global toast function
  toastListeners = [...toastListeners, addToast];

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
