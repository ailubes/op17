"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setClientLocale } from "@/lib/locale";
import { useLocale } from "@/lib/use-locale";

interface ShopHeaderProps {
  /** Use "full" for fixed image logo (main shop pages), "simple" for static text logo (cart/checkout) */
  variant?: "full" | "simple";
  /** Title for simple variant (e.g., "Shop", "Checkout", "Status") */
  title?: string;
  /** Back link href */
  backHref: string;
  /** Back link label */
  backLabel: string;
  /** Show cart icon */
  showCart?: boolean;
  /** Cart item count */
  cartCount?: number;
  /** Show locale switcher */
  showLocaleSwitcher?: boolean;
}

export function ShopHeader({
  variant = "full",
  title = "Shop",
  backHref,
  backLabel,
  showCart = false,
  cartCount = 0,
  showLocaleSwitcher = true,
}: ShopHeaderProps) {
  const locale = useLocale();
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

  const isSimple = variant === "simple";

  return (
    <header
      className={
        isSimple
          ? "border-b border-white/10 bg-slate-950/95"
          : "fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10"
      }
    >
      <div
        className={
          isSimple
            ? "mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
            : "container mx-auto px-6 md:px-14 py-4 flex items-center justify-between"
        }
      >
        {isSimple ? (
          <Link href="/shop" className="font-bebas text-3xl tracking-widest text-white">
            OP17 {title}
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logos/blue-yellow.png"
              alt="Oleh Plotnytskyi OP17 logo"
              className="h-10 md:h-12 w-auto transition-transform group-hover:scale-105"
            />
            <span className="sr-only">OP17</span>
          </Link>
        )}

        <div className="flex items-center gap-6">
          {showLocaleSwitcher && (
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
          )}

          <Link
            href={backHref}
            className="font-barlow font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider text-sm"
          >
            {backLabel}
          </Link>

          {showCart && (
            <Link
              href="/shop/cart"
              className="relative p-2 text-white hover:text-gold transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
