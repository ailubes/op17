"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { ShopHeader, ShopFooter } from "@/components/shop";

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
      <ShopHeader
        variant="simple"
        title="Shop"
        backHref="/shop"
        backLabel={t.cart.continueShopping}
      />

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
      <ShopFooter t={t.footer} />
    </div>
  );
}
