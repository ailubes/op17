"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { setClientLocale } from "@/lib/locale";
import { useLocale } from "@/lib/use-locale";

interface Variant {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  priceEur?: number | null;
  backorderPolicy?: string | null;
}

interface Product {
  id: string;
  name: string;
  category?: { id: string; name: string } | null;
  basePriceEur: number;
  description?: string | null;
  type?: string | null;
  gender?: string | null;
  sport?: string | null;
  backorderPolicy?: string | null;
  collection?: { id: string; name: string; backorderPolicy?: string | null } | null;
  variants: Variant[];
  media?: { id: string; objectKey: string; bucket: string; url?: string | null; alt?: string | null }[];
}

const canBackorder = (product: Product, variant?: Variant) => {
  return (
    variant?.backorderPolicy === "ALLOW" ||
    product.backorderPolicy === "ALLOW" ||
    product.collection?.backorderPolicy === "ALLOW"
  );
};

const formatPrice = (amount: number) => `EUR ${amount}`;

const Shop: React.FC = () => {
  const locale = useLocale();
  const t = getMessages(locale);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
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

  const loadProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/storefront/products");
    if (!res.ok) {
      setError("Failed to load products.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProducts(data.data || []);
    setLoading(false);
  };

  const loadCartCount = async () => {
    const res = await fetch("/api/cart", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    const count = data?.data?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0;
    setCartCount(count);
  };

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, []);

  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => {
      if (product.category?.name) {
        names.add(product.category.name);
      }
    });
    return [t.shop.categoryAll, ...Array.from(names)];
  }, [products, t.shop.categoryAll]);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category?.name === selectedCategory);

  const addToCart = async (product: Product, variant?: Variant) => {
    setError(null);
    const chosenVariant = variant || product.variants[0];
    if (!chosenVariant) {
      setError("No variants available for this product.");
      return;
    }

    if (chosenVariant.stock <= 0 && !canBackorder(product, chosenVariant)) {
      setError("This variant is out of stock.");
      return;
    }

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: chosenVariant.id, quantity: 1 }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to add to cart.");
      return;
    }

    await loadCartCount();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 md:px-14 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logos/blue-yellow.png"
              alt="Oleh Plotnytskyi OP17 logo"
              className="h-10 md:h-12 w-auto transition-transform group-hover:scale-105"
            />
            <span className="sr-only">OP17</span>
          </Link>

          <div className="flex items-center gap-6">
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
              href="/"
              className="font-barlow font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider text-sm"
            >
              {t.shop.backToHome}
            </Link>
            <Link
              href="/shop/cart"
              className="relative p-2 text-white hover:text-gold transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bebas text-[30vw] text-white/5 whitespace-nowrap">
            SHOP
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-14 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-gold/20 text-gold font-barlow font-bold tracking-[0.2em] uppercase text-sm mb-6">
            {t.shop.officialMerch}
          </span>
          <h1 className="font-bebas text-6xl md:text-8xl mb-6 text-gold">
            {t.shop.collectionTitle}
          </h1>
          <p className="font-inter text-slate-400 max-w-xl mx-auto text-lg">
            {t.shop.collectionSubtitle}
          </p>
          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
        </div>
      </section>

      <section className="py-8 border-b border-white/10 sticky top-[73px] bg-slate-950/95 backdrop-blur-md z-40">
        <div className="container mx-auto px-6 md:px-14">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 font-barlow font-bold uppercase tracking-wider text-sm transition-all ${
                  selectedCategory === category
                    ? "bg-gold text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 md:px-14">
          {loading ? (
            <p className="text-slate-400">{t.shop.loadingProducts}</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-inter text-slate-400 text-lg">{t.shop.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  labels={t.shop}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-900 border-t border-white/10">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">{t.shop.secureCheckout}</h3>
              <p className="font-inter text-slate-400 text-sm">{t.shop.secureCheckoutDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">{t.shop.officialGear}</h3>
              <p className="font-inter text-slate-400 text-sm">{t.shop.officialGearDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">{t.shop.novaPostDelivery}</h3>
              <p className="font-inter text-slate-400 text-sm">{t.shop.novaPostDeliveryDesc}</p>
            </div>
          </div>
        </div>
      </section>

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
};

const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (product: Product, variant?: Variant) => void;
  labels: {
    soldOut: string;
    addToCart: string;
    uncategorized: string;
  };
}> = ({ product, onAddToCart, labels }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id || null
  );
  const [isHovered, setIsHovered] = useState(false);

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.priceEur ?? product.basePriceEur;
  const available =
    (selectedVariant?.stock ?? 0) > 0 || (selectedVariant && canBackorder(product, selectedVariant));
  const heroMedia = product.media?.[0];
  const heroImage = heroMedia?.url || null;

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 border border-white/10 mb-4">
        {heroImage ? (
          <>
            <img
              src={heroImage}
              alt={heroMedia?.alt || product.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/40 to-transparent"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bebas text-3xl text-slate-500">{product.name}</span>
            </div>
          </>
        )}

        {!available && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
            <span className="font-bebas text-2xl text-slate-400">{labels.soldOut}</span>
          </div>
        )}

        {product.variants.length > 0 && (
          <div
            className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {product.variants.some((variant) => variant.size) && (
              <div className="flex gap-2 mb-3 justify-center flex-wrap">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`w-9 h-9 font-barlow font-bold text-xs transition-all ${
                      selectedVariantId === variant.id
                        ? "bg-gold text-slate-950"
                        : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    {variant.size || "One"}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => onAddToCart(product, selectedVariant || undefined)}
              className="w-full py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              {labels.addToCart}
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <span className="font-barlow text-ukraine-blue text-xs uppercase tracking-widest">
          {product.category?.name || labels.uncategorized}
        </span>
        <h3 className="font-bebas text-xl text-white mt-1 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="font-bebas text-2xl text-gold">{formatPrice(price)}</span>
        </div>
      </div>
    </div>
  );
};

export default Shop;
