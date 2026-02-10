"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { HomeMessages } from "@/lib/i18n";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePriceEur: number;
  media?: { id: string; url?: string | null; alt?: string | null }[];
  variants: { id: string; stock: number; priceEur?: number | null; isBackorderEnabled?: boolean }[];
  category?: { id: string; name: string } | null;
}

type ShopPreviewProps = {
  copy: HomeMessages["shopPreview"];
};

const formatPrice = (amount: number) => `EUR ${amount}`;

export const ShopPreview: React.FC<ShopPreviewProps> = ({ copy }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null);
        const res = await fetch("/api/storefront/products?limit=3");
        if (!res.ok) {
          setError(copy.error || "Failed to load products");
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Show first 3 products only
        setProducts((data.data || []).slice(0, 3));
      } catch {
        setError(copy.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [copy.error]);

  // Show placeholder products from i18n if no real products loaded yet
  const displayProducts = products.length > 0
    ? products.map((p) => ({
        id: p.id,
        title: p.name,
        price: `EUR ${p.variants?.[0]?.priceEur ?? p.basePriceEur}`,
        image: p.media?.[0]?.url,
        slug: p.slug,
        inStock: p.variants?.some((v) => v.stock > 0) ?? false,
        category: p.category?.name,
      }))
    : [];

  // Don't render section if no products and not loading
  if (!loading && displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-32 px-6 md:px-14 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14">
        <div>
          <h2 className="font-bebas text-6xl tracking-wider mb-2 reveal opacity-0 translate-y-10 transition-all duration-1000">
            {copy.titleLead} <span className="text-ukraine-blue">{copy.titleHighlight}</span>
          </h2>
          <p className="text-slate-400 font-inter max-w-lg reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            {copy.subtitle}
          </p>
        </div>
        <Link
          href="/shop"
          className="font-barlow font-bold text-slate-300 uppercase tracking-widest mt-6 md:mt-0 group flex items-center gap-2 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300"
        >
          {copy.viewAll} <span className="group-hover:translate-x-2 transition-transform">-&gt;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading
          ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-white/5 p-6 animate-pulse"
              >
                <div className="aspect-square bg-slate-800/50 mb-6"></div>
                <div className="h-8 bg-slate-800/50 mb-4 w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-slate-800/50 w-20"></div>
                  <div className="h-10 bg-slate-800/50 w-24"></div>
                </div>
              </div>
            ))
          )
          : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-400 font-inter">{error}</p>
            </div>
          )
          : displayProducts.length > 0
          ? (
            displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} copy={copy} />
            ))
          )
          : null}
      </div>
    </section>
  );
};

interface DisplayProduct {
  id: string;
  title: string;
  price: string;
  image?: string | null;
  slug: string;
  inStock: boolean;
  category?: string;
}

const ProductCard: React.FC<{
  product: DisplayProduct;
  copy: HomeMessages["shopPreview"];
}> = ({ product, copy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || !product.inStock) return;

    setIsAdding(true);
    setAddSuccess(false);

    try {
      // Fetch product details to get the first available variant
      const response = await fetch(`/api/storefront/products?slug=${product.slug}`);
      if (!response.ok) throw new Error("Failed to fetch product details");

      const data = await response.json();
      const productData = data.data;

      if (!productData?.variants?.length) {
        throw new Error("No variants available");
      }

      // Find first available variant (in stock or backorder enabled)
      const availableVariant = productData.variants.find(
        (v: { stock: number; isBackorderEnabled?: boolean }) => v.stock > 0 || v.isBackorderEnabled
      );

      if (!availableVariant) {
        throw new Error("Product is out of stock");
      }

      // Add to cart
      const cartResponse = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: availableVariant.id,
          quantity: 1,
        }),
      });

      if (!cartResponse.ok) {
        const errorData = await cartResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add to cart");
      }

      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert(copy.addError || "Failed to add item to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="reveal opacity-0 translate-y-10 transition-all duration-1000 bg-slate-900 border border-white/5 p-6 group relative overflow-hidden flex flex-col hover:border-gold/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500">
      </div>

      <div className="aspect-square bg-slate-800/50 mb-6 flex items-center justify-center relative overflow-hidden">
        {product.image
          ? (
            <img
              src={product.image}
              alt={product.title}
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )
          : (
            <div className="flex items-center justify-center">
              <span className="font-bebas text-4xl text-slate-600">
                {product.title.charAt(0)}
              </span>
            </div>
          )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
            <span className="font-bebas text-xl text-slate-400">Sold Out</span>
          </div>
        )}

        {/* Hover overlay with button */}
        <div
          className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent transition-all duration-300 ${
            isHovered && product.inStock ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`block w-full py-3 font-barlow font-bold uppercase tracking-wider text-sm text-center transition-colors ${
              addSuccess
                ? "bg-green-500 text-white"
                : "bg-gold text-slate-950 hover:bg-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAdding
              ? copy.addingButton || "Adding..."
              : addSuccess
              ? copy.addedButton || "Added!"
              : copy.addButton}
          </button>
        </div>
      </div>

      <span className="font-barlow text-ukraine-blue text-xs uppercase tracking-widest mb-2">
        {product.category || copy.fallbackCategory || "Gear"}
      </span>
      <h3 className="font-barlow font-bold text-2xl uppercase mb-4">{product.title}</h3>
      <div className="flex justify-between items-center mt-auto">
        <span className="font-bebas text-3xl text-gold">{product.price}</span>
        <span className="px-4 py-2 border border-gold text-gold font-barlow font-bold uppercase group-hover:bg-gold group-hover:text-slate-950 transition-all">
          {copy.addButton}
        </span>
      </div>
    </Link>
  );
};
