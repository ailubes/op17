"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { setClientLocale } from "@/lib/locale";
import { useLocale } from "@/lib/use-locale";

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
  const locale = useLocale();
  const t = getMessages(locale);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentRedirecting, setPaymentRedirecting] = useState(false);
  const [activeLocale, setActiveLocale] = useState(locale);

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  const changeLocale = (nextLocale: "en" | "uk" | "it") => {
    if (nextLocale === activeLocale) return;
    setClientLocale(nextLocale);
    setActiveLocale(nextLocale);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

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
          <div className="flex items-center gap-4">
            <div
              className="hidden sm:flex items-center gap-2 border border-white/10 bg-slate-900/60 px-2 py-1"
              suppressHydrationWarning
            >
              {[
                { label: "EN", value: "en" },
                { label: "UK", value: "uk" },
                { label: "IT", value: "it" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => changeLocale(item.value as "en" | "uk" | "it")}
                  className={`px-2 py-1 text-[11px] font-barlow font-bold uppercase tracking-[0.2em] transition-colors ${
                    activeLocale === item.value
                      ? "bg-gold text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Link
              href="/shop/cart"
              className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
            >
              {t.checkout.backToCart}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-bebas text-5xl mb-6">{t.checkout.title}</h1>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        {orderNumber && (
          <div className="mb-6 border border-gold/40 bg-gold/10 p-4 text-gold">
            {t.checkout.orderCreated} {orderNumber}
            <div className="mt-2 text-sm">
              <Link href={`/shop/payment-status?order=${orderNumber}`} className="underline">
                {t.checkout.viewStatus}
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading checkout...</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="border border-white/10 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-400">{t.checkout.empty}</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              {t.checkout.backToShop}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <section className="border border-white/10 bg-slate-900/60 p-6">
                <h2 className="font-bebas text-2xl mb-4">{t.checkout.contact}</h2>
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
                <h2 className="font-bebas text-2xl mb-4">{t.checkout.shipping}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    placeholder={t.checkout.name}
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder={t.checkout.city}
                    required
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder={t.checkout.region}
                    value={form.region}
                    onChange={(event) => setForm({ ...form, region: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder={t.checkout.postalCode}
                    value={form.postalCode}
                    onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder={t.checkout.street1}
                    required
                    value={form.street1}
                    onChange={(event) => setForm({ ...form, street1: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <input
                    placeholder={t.checkout.street2}
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
                    placeholder={t.checkout.novaPostOffice}
                    value={form.novaPostOfficeName}
                    onChange={(event) => setForm({ ...form, novaPostOfficeName: event.target.value })}
                    className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </section>

              <section className="border border-white/10 bg-slate-900/60 p-6">
                <h2 className="font-bebas text-2xl mb-4">{t.checkout.payment}</h2>
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
                {paymentRedirecting
                  ? t.checkout.redirecting
                  : submitting
                    ? t.checkout.processing
                    : t.checkout.placeOrder}
              </button>
            </form>

            <aside className="border border-white/10 bg-slate-900/60 p-6 h-fit">
              <h3 className="font-bebas text-2xl">{t.checkout.orderSummary}</h3>
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
                <span className="font-bebas text-2xl">{t.cart.total}</span>
                <span className="font-bebas text-3xl text-gold">{formatCurrency(subtotal, "EUR")}</span>
              </div>
            </aside>
          </div>
        )}
      </main>
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="container mx-auto px-6 md:px-14 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 group">
                <img
                  src="/images/logos/blue-yellow.png"
                  alt="Oleh Plotnytskyi OP17 logo"
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
                <span className="sr-only">OP17</span>
              </Link>
              <p className="mt-4 text-slate-400 text-sm max-w-xs">{t.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-barlow font-bold uppercase tracking-widest mb-4 text-white">
                {t.footer.shopLinks}
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link href="/shop" className="hover:text-gold transition-colors">
                    {t.footer.shopHome}
                  </Link>
                </li>
                <li>
                  <Link href="/shop/cart" className="hover:text-gold transition-colors">
                    {t.footer.cart}
                  </Link>
                </li>
                <li>
                  <Link href="/shop/checkout" className="hover:text-gold transition-colors">
                    {t.footer.checkout}
                  </Link>
                </li>
                <li>
                  <Link href="/shop/payment-status" className="hover:text-gold transition-colors">
                    {t.footer.paymentStatus}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-barlow font-bold uppercase tracking-widest mb-4 text-white">
                {t.footer.support}
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>{t.footer.shipping}</li>
                <li>{t.footer.payments}</li>
                <li>{t.footer.supportEmail}</li>
              </ul>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Plotnytskyi Collection. {t.footer.rights}
            </p>
            <p className="uppercase tracking-[0.2em] text-slate-600">{t.footer.official}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
