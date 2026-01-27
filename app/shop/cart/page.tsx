"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { setClientLocale } from "@/lib/locale";
import { useLocale } from "@/lib/use-locale";

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

export default function CartPage() {
  const locale = useLocale();
  const t = getMessages(locale);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const updateQuantity = async (item: CartItem, quantity: number) => {
    setError(null);
    const res = await fetch(`/api/cart/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to update item.");
      return;
    }

    await loadCart();
  };

  const removeItem = async (item: CartItem) => {
    setError(null);
    const res = await fetch(`/api/cart/items/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      setError("Failed to remove item.");
      return;
    }

    await loadCart();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/shop" className="font-bebas text-3xl tracking-widest">
            OP17 Shop
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
              href="/shop"
              className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
            >
              {t.cart.continueShopping}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-bebas text-5xl mb-6">{t.cart.title}</h1>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {loading ? (
          <p className="text-slate-400">{t.cart.loading}</p>
        ) : cart && cart.items.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bebas text-2xl">{item.variant.product.name}</h2>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        SKU {item.variant.sku}
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.variant.size ? `Size ${item.variant.size}` : ""}
                        {item.variant.color ? ` · ${item.variant.color}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item)}
                      className="text-xs uppercase tracking-[0.2em] text-red-300 hover:text-red-400"
                    >
                      {t.cart.remove}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        className="w-9 h-9 border border-white/10 text-sm hover:border-gold"
                      >
                        -
                      </button>
                      <span className="font-bebas text-xl">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        className="w-9 h-9 border border-white/10 text-sm hover:border-gold"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bebas text-2xl text-gold">EUR {item.unitPriceEur}</p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="border border-white/10 bg-slate-900/60 p-6 h-fit">
              <h3 className="font-bebas text-2xl">{t.cart.summary}</h3>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>{t.cart.subtotal}</span>
                <span>{formatCurrency(subtotal, "EUR")}</span>
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                <span className="font-bebas text-2xl">{t.cart.total}</span>
                <span className="font-bebas text-3xl text-gold">
                  {formatCurrency(subtotal, "EUR")}
                </span>
              </div>
              <Link
                href="/shop/checkout"
                className="mt-6 block w-full bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider py-3 text-center hover:bg-white transition-colors"
              >
                {t.cart.proceed}
              </Link>
            </aside>
          </div>
        ) : (
          <div className="border border-white/10 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-400">{t.cart.empty}</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              {t.cart.backToShop}
            </Link>
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
