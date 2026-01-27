"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceEur: number;
};

type Payment = {
  id: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
};

type Shipment = {
  id: string;
  status: string;
  trackingNumber?: string | null;
  method: string;
};

type OrderStatus = {
  orderNumber: string;
  status: string;
  currency: string;
  totalMinor: number;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
};

const formatCurrency = (amountMinor: number, currency: string) => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderStatus | null>(null);

  useEffect(() => {
    const order = searchParams.get("order") || "";
    if (order && !orderNumber) {
      setOrderNumber(order);
    }
  }, [searchParams, orderNumber]);

  const submitLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, email }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Order not found.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setResult(data.data || null);
    setLoading(false);
  };

  const paymentSummary = useMemo(() => {
    if (!result) return "";
    const statuses = result.payments.map((payment) => payment.status).join(", ");
    return statuses || "No payments found";
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/shop" className="font-bebas text-3xl tracking-widest">
            OP17 Status
          </Link>
          <Link
            href="/shop"
            className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
          >
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <h1 className="font-bebas text-5xl">Payment Status</h1>
          <p className="text-slate-400">
            Enter your order number and email to view the latest payment and fulfillment updates.
          </p>
        </div>

        <form className="border border-white/10 bg-slate-900/60 p-6 space-y-4" onSubmit={submitLookup}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Order Number (e.g. OP17-20260127-AB12)"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider py-3 hover:bg-white transition-colors disabled:opacity-60"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </form>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && (
          <section className="border border-white/10 bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bebas text-3xl">Order {result.orderNumber}</h2>
                <p className="text-slate-400">Placed {new Date(result.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="font-bebas text-2xl text-gold">{result.status}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-bebas text-xl">Payments</h3>
                <p className="text-sm text-slate-300">{paymentSummary}</p>
                {result.payments.map((payment) => (
                  <div key={payment.id} className="text-sm text-slate-400">
                    {payment.provider} · {payment.status} · {formatCurrency(payment.amountMinor, payment.currency)}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="font-bebas text-xl">Shipment</h3>
                {result.shipments.length === 0 ? (
                  <p className="text-sm text-slate-400">No shipment created yet.</p>
                ) : (
                  result.shipments.map((shipment) => (
                    <div key={shipment.id} className="text-sm text-slate-400">
                      {shipment.method} · {shipment.status}
                      {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bebas text-xl mb-2">Items</h3>
              <div className="space-y-2">
                {result.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
                    <span>{item.name}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-bebas text-2xl">Total</span>
                <span className="font-bebas text-3xl text-gold">
                  {formatCurrency(result.totalMinor, result.currency)}
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
