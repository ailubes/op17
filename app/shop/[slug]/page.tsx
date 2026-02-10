"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { ShopHeader, ShopFooter } from "@/components/shop";

interface Variant {
  id: string;
  sku: string;
  name?: string | null;
  size?: string | null;
  color?: string | null;
  stock: number;
  priceEur?: number | null;
  backorderPolicy?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePriceEur: number;
  backorderPolicy?: string | null;
  category?: { id: string; name: string } | null;
  collection?: { id: string; name: string; backorderPolicy?: string | null } | null;
  variants: Variant[];
  media: { id: string; url: string; alt?: string | null }[];
}

const canBackorder = (product: Product, variant?: Variant) => {
  return (
    variant?.backorderPolicy === "ALLOW" ||
    product.backorderPolicy === "ALLOW" ||
    product.collection?.backorderPolicy === "ALLOW"
  );
};

const formatPrice = (amount: number) => `EUR ${amount}`;

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = getMessages(locale);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const loadProduct = async () => {
    if (!params.slug) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/storefront/products/${params.slug}`);
    if (!res.ok) {
      if (res.status === 404) {
        router.push("/shop");
        return;
      }
      setError("Failed to load product.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProduct(data.data);
    if (data.data?.variants?.[0]?.id) {
      setSelectedVariantId(data.data.variants[0].id);
    }
    setLoading(false);
  };

  const loadCartCount = async () => {
    const res = await fetch("/api/cart", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    const count = data?.data?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;
    setCartCount(count);
  };

  useEffect(() => {
    loadProduct();
    loadCartCount();
  }, [params.slug]);

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId);
  const price = selectedVariant?.priceEur ?? product?.basePriceEur ?? 0;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const canOrder = inStock || (product && selectedVariant && canBackorder(product, selectedVariant));

  const addToCart = async () => {
    if (!product || !selectedVariant || addingToCart) return;
    setError(null);
    setAddedToCart(false);
    setAddingToCart(true);

    if (!canOrder) {
      setError(t.productDetail.outOfStock);
      setAddingToCart(false);
      return;
    }

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: selectedVariant.id, quantity: 1 }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to add to cart.");
      setAddingToCart(false);
      return;
    }

    await loadCartCount();
    setAddedToCart(true);
    setAddingToCart(false);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const sizes = product?.variants.filter((v) => v.size).map((v) => ({ id: v.id, size: v.size! })) ?? [];
  const colors = product?.variants.filter((v) => v.color).map((v) => ({ id: v.id, color: v.color! })) ?? [];
  const uniqueSizes = [...new Map(sizes.map((s) => [s.size, s])).values()];
  const uniqueColors = [...new Map(colors.map((c) => [c.color, c])).values()];

  const mainImage = product?.media?.[selectedImageIndex]?.url;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 font-inter">{t.shop.loadingProducts}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 font-inter">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ShopHeader
        variant="full"
        backHref="/shop"
        backLabel={t.productDetail.backToShop}
        showCart
        cartCount={cartCount}
      />

      {/* Breadcrumbs */}
      <div className="pt-24 pb-4 bg-slate-950">
        <div className="container mx-auto px-6 md:px-14">
          <nav className="flex items-center gap-2 text-sm font-barlow text-slate-400">
            <Link href="/shop" className="hover:text-white transition-colors">
              {t.footer.shopHome}
            </Link>
            <span className="text-slate-600">/</span>
            {product.category && (
              <>
                <span className="text-slate-400">{product.category.name}</span>
                <span className="text-slate-600">/</span>
              </>
            )}
            <span className="text-white">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <section className="pb-16">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 border border-white/10 mb-4">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.media?.[selectedImageIndex]?.alt || product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="font-bebas text-4xl text-slate-500">{product.name}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.media.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.media.map((media, index) => (
                    <button
                      key={media.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-24 overflow-hidden border transition-all ${
                        selectedImageIndex === index
                          ? "border-gold"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <img
                        src={media.url}
                        alt={media.alt || `${product.name} thumbnail ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category Badge */}
              {product.category && (
                <span className="inline-block self-start px-3 py-1 bg-ukraine-blue/20 text-ukraine-blue font-barlow font-bold tracking-[0.15em] uppercase text-xs mb-4">
                  {product.category.name}
                </span>
              )}

              {/* Product Name */}
              <h1 className="font-bebas text-5xl md:text-6xl text-white mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="font-bebas text-4xl text-gold mb-6">
                {formatPrice(price)}
              </div>

              {/* Description */}
              {product.description && (
                <p className="font-inter text-slate-400 leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Size Selector */}
              {uniqueSizes.length > 0 && (
                <div className="mb-6">
                  <label className="block font-barlow font-bold uppercase tracking-wider text-sm text-white mb-3">
                    {t.productDetail.selectSize}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.filter((v) => v.size).map((variant) => {
                      const variantAvailable = variant.stock > 0 || canBackorder(product, variant);
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          disabled={!variantAvailable}
                          className={`min-w-[48px] h-12 px-4 font-barlow font-bold text-sm transition-all ${
                            selectedVariantId === variant.id
                              ? "bg-gold text-slate-950"
                              : variantAvailable
                                ? "bg-slate-800 text-white hover:bg-slate-700"
                                : "bg-slate-900 text-slate-600 cursor-not-allowed line-through"
                          }`}
                        >
                          {variant.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {uniqueColors.length > 0 && (
                <div className="mb-6">
                  <label className="block font-barlow font-bold uppercase tracking-wider text-sm text-white mb-3">
                    {t.productDetail.selectColor}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.filter((v) => v.color).map((variant) => {
                      const variantAvailable = variant.stock > 0 || canBackorder(product, variant);
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          disabled={!variantAvailable}
                          className={`px-4 h-12 font-barlow font-bold text-sm transition-all ${
                            selectedVariantId === variant.id
                              ? "bg-gold text-slate-950"
                              : variantAvailable
                                ? "bg-slate-800 text-white hover:bg-slate-700"
                                : "bg-slate-900 text-slate-600 cursor-not-allowed line-through"
                          }`}
                        >
                          {variant.color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <span className="inline-flex items-center gap-2 font-barlow text-sm text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    {t.productDetail.inStock}
                  </span>
                ) : canOrder ? (
                  <span className="inline-flex items-center gap-2 font-barlow text-sm text-yellow-400">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    {t.productDetail.backorder}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 font-barlow text-sm text-red-400">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    {t.productDetail.outOfStock}
                  </span>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={!canOrder || addingToCart}
                className={`w-full py-4 font-barlow font-bold uppercase tracking-wider text-sm transition-all ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : canOrder
                      ? "bg-gold text-slate-950 hover:bg-white"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              >
                {addingToCart
                  ? "..."
                  : addedToCart
                    ? t.productDetail.addedToCart
                    : t.productDetail.addToCart}
              </button>

              {/* Continue Shopping / Go to Cart */}
              {addedToCart && (
                <div className="flex gap-4 mt-4">
                  <Link
                    href="/shop"
                    className="flex-1 py-3 text-center border border-white/20 text-white font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white/5 transition-colors"
                  >
                    {t.cart.continueShopping}
                  </Link>
                  <Link
                    href="/shop/cart"
                    className="flex-1 py-3 text-center bg-slate-800 text-white font-barlow font-bold uppercase tracking-wider text-sm hover:bg-slate-700 transition-colors"
                  >
                    {t.footer.cart}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      <ShopFooter t={t.footer} />
    </div>
  );
};

export default ProductDetailPage;
