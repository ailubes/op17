"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const CURRENCIES = ["EUR", "USD", "UAH"] as const;
const SHIPPING_METHODS = ["NOVA_POST_BRANCH", "NOVA_POST_COURIER"] as const;
const PAYMENT_PROVIDERS = ["LIQPAY", "MONOBANK"] as const;

type CartItem = {
  id: string;
  quantity: number;
  unitPriceEur: number;
  variant: {
    id: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    product: {
      id: string;
      name: string;
    };
  };
};

type Cart = {
  id: string;
  currency: string;
  items: CartItem[];
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentRedirecting, setPaymentRedirecting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    currency: "EUR",
    shippingMethod: "NOVA_POST_BRANCH",
    provider: "LIQPAY",
    name: "",
    country: "Ukraine",
    region: "",
    city: "",
    postalCode: "",
    street1: "",
    street2: "",
    novaPostOfficeId: "",
    novaPostOfficeName: "",
  });

  const loadCart = async () => {
    setLoading(true);
    const res = await fetch("/api/cart", { credentials: "include" });
    if (!res.ok) {
      setError("Failed to load cart.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCart(data.data || null);
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const subtotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.unitPriceEur * item.quantity, 0);
  }, [cart]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      email: form.email,
      phone: form.phone,
      currency: form.currency,
      shippingMethod: form.shippingMethod,
      provider: form.provider,
      shippingAddress: {
        name: form.name,
        phone: form.phone,
        country: form.country,
        region: form.region || undefined,
        city: form.city,
        postalCode: form.postalCode || undefined,
        street1: form.street1,
        street2: form.street2 || undefined,
        novaPostOfficeId: form.novaPostOfficeId || undefined,
        novaPostOfficeName: form.novaPostOfficeName || undefined,
      },
    };

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Checkout failed.");
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    const createdOrder = data?.data;
    setOrderNumber(createdOrder?.orderNumber || "");
    setSubmitting(false);
    await loadCart();

    if (!createdOrder?.id) {
      return;
    }

    if (form.provider === "LIQPAY") {
      setPaymentRedirecting(true);
      const liqpayRes = await fetch("/api/payments/liqpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrder.id }),
        credentials: "include",
      });

      if (!liqpayRes.ok) {
        const liqpayError = await liqpayRes.json().catch(() => null);
        setError(liqpayError?.error || "Failed to start LiqPay checkout.");
        setPaymentRedirecting(false);
        return;
      }

      const liqpayData = await liqpayRes.json();
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = liqpayData.url;
      formEl.acceptCharset = "utf-8";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = liqpayData.data;
      formEl.appendChild(dataInput);

      const signatureInput = document.createElement("input");
      signatureInput.type = "hidden";
      signatureInput.name = "signature";
      signatureInput.value = liqpayData.signature;
      formEl.appendChild(signatureInput);

      document.body.appendChild(formEl);
      formEl.submit();
      return;
    }

    if (form.provider === "MONOBANK") {
      setPaymentRedirecting(true);
      const monoRes = await fetch("/api/payments/monobank/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrder.id }),
        credentials: "include",
      });

      if (!monoRes.ok) {
        const monoError = await monoRes.json().catch(() => null);
        setError(monoError?.error || "Failed to create Monobank invoice.");
        setPaymentRedirecting(false);
        return;
      }

      const invoice = await monoRes.json();
      if (invoice?.data?.pageUrl) {
        window.location.href = invoice.data.pageUrl;
        return;
      }

      setError("Monobank invoice missing payment URL.");
      setPaymentRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/shop" className="font-bebas text-3xl tracking-widest">
            OP17 Checkout
          </Link>
          <Link
            href="/shop/cart"
            className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
          >
            Back to Cart
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-bebas text-5xl mb-6">Checkout</h1>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        {orderNumber && (
          <div className="mb-6 border border-gold/40 bg-gold/10 p-4 text-gold">
            Order created successfully. Order number: {orderNumber}
            <div className="mt-2 text-sm">
              <Link href={`/shop/payment-status?order=${orderNumber}`} className="underline">
                View payment status
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading checkout...</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="border border-white/10 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-400">Your cart is empty.</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <section className="border border-white/10 bg-slate-900/60 p-6">
                <h2 className="font-bebas text-2xl mb-4">Contact</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </section>

              <section className="border border-white/10 bg-slate-900/60 p-6">
                <h2 className="font-bebas text-2xl mb-4">Shipping</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    placeholder="Full Name"
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder="City"
                    required
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Region"
                    value={form.region}
                    onChange={(event) => setForm({ ...form, region: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Postal Code"
                    value={form.postalCode}
                    onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Street Address"
                    required
                    value={form.street1}
                    onChange={(event) => setForm({ ...form, street1: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Apartment, suite (optional)"
                    value={form.street2}
                    onChange={(event) => setForm({ ...form, street2: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select
                    value={form.shippingMethod}
                    onChange={(event) => setForm({ ...form, shippingMethod: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                  >
                    {SHIPPING_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replace("NOVA_POST_", "Nova Post ")}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Nova Post Office"
                    value={form.novaPostOfficeName}
                    onChange={(event) => setForm({ ...form, novaPostOfficeName: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </section>

              <section className="border border-white/10 bg-slate-900/60 p-6">
                <h2 className="font-bebas text-2xl mb-4">Payment</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.provider}
                    onChange={(event) => setForm({ ...form, provider: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
                  >
                    {PAYMENT_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider py-3 hover:bg-white transition-colors disabled:opacity-60"
              >
                {paymentRedirecting ? "Redirecting to payment..." : submitting ? "Processing..." : "Place Order"}
              </button>
            </form>

            <aside className="border border-white/10 bg-slate-900/60 p-6 h-fit">
              <h3 className="font-bebas text-2xl">Order Summary</h3>
              <div className="mt-4 space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
                    <div>
                      <p>{item.variant.product.name}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                    <span>EUR {item.unitPriceEur}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                <span className="font-bebas text-2xl">Total</span>
                <span className="font-bebas text-3xl text-gold">{formatCurrency(subtotal, "EUR")}</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
