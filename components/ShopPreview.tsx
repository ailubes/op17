"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/use-locale";
import type { HomeMessages } from "@/lib/i18n";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePriceEur: number;
  category?: { id: string; name: string } | null;
  media: Array<{
    id: string;
    url: string;
    alt?: string | null;
  }>;
  variants?: Array<{
    id: string;
    sku: string;
    stock: number;
    isBackorderEnabled: boolean;
  }>;
}

interface ProductsResponse {
  data: Product[];
}

type ShopPreviewProps = {
  copy: HomeMessages["shopPreview"];
};

const formatPrice = (amount: number) => `EUR ${amount}`;

export const ShopPreview: React.FC<ShopPreviewProps> = ({ copy }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        // First try to fetch featured products
        let response = await fetch(
          `/api/storefront/products?featured=true&limit=3&locale=${locale}`
        );
        if (response.ok) {
          const data: ProductsResponse = await response.json();
          if (data.data.length > 0) {
            setProducts(data.data);
          } else {
            // If no featured products, fetch the 3 most recent products
            response = await fetch(
              `/api/storefront/products?limit=3&locale=${locale}`
            );
            if (response.ok) {
              const recentData: ProductsResponse = await response.json();
              setProducts(recentData.data.slice(0, 3));
            } else {
              setError(copy.error || "Failed to load products");
            }
          }
        } else {
          setError(copy.error || "Failed to load products");
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(copy.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [locale, copy.error]);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          // Loading skeleton - matches shop page card style
          <>
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 border border-white/10 mb-4 animate-pulse" />
                <div className="h-6 bg-slate-800/50 mb-2 animate-pulse w-3/4 mx-auto" />
                <div className="h-8 bg-slate-800/50 animate-pulse w-24 mx-auto" />
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 font-inter">{error}</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} copy={copy} />
          ))
        )}
      </div>
    </section>
  );
};

const ProductCard: React.FC<{
  product: Product;
  copy: HomeMessages["shopPreview"];
}> = ({ product, copy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const heroMedia = product.media?.[0];
  const heroImage = heroMedia?.url || null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;

    setIsAdding(true);
    setAddSuccess(false);

    try {
      // Fetch product details to get the first available variant
      const response = await fetch(`/api/storefront/products?slug=${product.slug}`);
      if (!response.ok) throw new Error("Failed to fetch product details");

      const data = await response.json();
      const productData = data.data?.[0];

      if (!productData?.variants?.length) {
        throw new Error("No variants available");
      }

      // Find first available variant (in stock or backorder enabled)
      const availableVariant = productData.variants.find(
        (v: { stock: number; isBackorderEnabled: boolean }) => v.stock > 0 || v.isBackorderEnabled
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
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 border border-white/10 mb-4">
        {heroImage ? (
          <>
            <img
              src={heroImage}
              alt={heroMedia?.alt || product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/40 to-transparent"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bebas text-3xl text-slate-500 text-center px-4">{product.name}</span>
            </div>
          </>
        )}

        {/* Hover overlay with button */}
        <div
          className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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

      <div className="text-center">
        <span className="font-barlow text-ukraine-blue text-xs uppercase tracking-widest">
          {product.category?.name || copy.fallbackCategory || "Gear"}
        </span>
        <h3 className="font-bebas text-xl text-white mt-1 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="font-bebas text-2xl text-gold">{formatPrice(product.basePriceEur)}</span>
        </div>
      </div>
    </Link>
  );
};
