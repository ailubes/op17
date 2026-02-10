"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;
const LOW_STOCK_THRESHOLD = 5;

type Product = {
  id: string;
  name: string;
};

type Variant = {
  id: string;
  sku: string;
  name?: string | null;
  size?: string | null;
  color?: string | null;
  priceEur?: number | null;
  stock: number;
  isActive: boolean;
  backorderPolicy?: string | null;
  product?: { id: string; name: string } | null;
};

const emptyForm = {
  productId: "",
  sku: "",
  name: "",
  size: "",
  color: "",
  priceEur: "",
  stock: "0",
  isActive: true,
  backorderPolicy: "DISALLOW",
};

export default function AdminVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkStockUpdates, setBulkStockUpdates] = useState<Record<string, string>>({});
  const [savingBulk, setSavingBulk] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [variantsRes, productsRes] = await Promise.all([
      fetch("/api/admin/variants", { credentials: "include" }),
      fetch("/api/admin/products", { credentials: "include" }),
    ]);

    if (!variantsRes.ok) {
      setError("Failed to load variants.");
      setLoading(false);
      return;
    }

    const variantsData = await variantsRes.json();
    const productsData = productsRes.ok ? await productsRes.json() : { data: [] };

    setVariants(variantsData.data || []);
    setProducts(productsData.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setForm({
      productId: variant.product?.id || "",
      sku: variant.sku || "",
      name: variant.name || "",
      size: variant.size || "",
      color: variant.color || "",
      priceEur: variant.priceEur !== null && variant.priceEur !== undefined ? variant.priceEur.toString() : "",
      stock: variant.stock?.toString() || "0",
      isActive: variant.isActive ?? true,
      backorderPolicy: variant.backorderPolicy || "DISALLOW",
    });
  };

  const submitForm = async () => {
    setError(null);
    const payload = {
      ...form,
      priceEur: form.priceEur === "" ? undefined : Number(form.priceEur),
      stock: Number(form.stock),
    };

    const res = await fetch(
      editingId ? `/api/admin/variants/${editingId}` : "/api/admin/variants",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Save failed.");
      return;
    }

    resetForm();
    loadData();
  };

  const removeVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;
    await fetch(`/api/admin/variants/${id}`, { method: "DELETE", credentials: "include" });
    loadData();
  };

  const handleBulkStockChange = (variantId: string, value: string) => {
    setBulkStockUpdates((prev) => ({ ...prev, [variantId]: value }));
  };

  const adjustStock = (variantId: string, delta: number) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const currentValue = bulkStockUpdates[variantId] !== undefined
      ? parseInt(bulkStockUpdates[variantId], 10)
      : variant.stock;
    const newValue = Math.max(0, currentValue + delta);
    setBulkStockUpdates((prev) => ({ ...prev, [variantId]: newValue.toString() }));
  };

  const saveBulkStockUpdates = async () => {
    setSavingBulk(true);
    setError(null);

    const updates = Object.entries(bulkStockUpdates)
      .filter(([_, value]) => value !== "")
      .map(([id, value]) => ({
        id,
        stock: parseInt(value, 10),
      }));

    if (updates.length === 0) {
      setBulkEditMode(false);
      setSavingBulk(false);
      return;
    }

    try {
      // Update each variant sequentially
      for (const update of updates) {
        if (Number.isNaN(update.stock)) continue;

        const res = await fetch(`/api/admin/variants/${update.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: update.stock }),
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to update variant ${update.id}`);
        }
      }

      setBulkStockUpdates({});
      setBulkEditMode(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setSavingBulk(false);
    }
  };

  const cancelBulkEdit = () => {
    setBulkEditMode(false);
    setBulkStockUpdates({});
  };

  const formTitle = useMemo(
    () => (editingId ? "Edit Variant" : "Create Variant"),
    [editingId]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Variants</h1>
          <p className="text-slate-400">Create SKUs, manage stock, and set variant pricing.</p>
        </div>
        <Link
          href="/admin"
          className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
        >
          Back to Admin
        </Link>
      </div>

      <section className="border border-white/10 bg-slate-900/60 p-6">
        <h2 className="font-bebas text-2xl mb-4">{formTitle}</h2>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Product</label>
            <select
              value={form.productId}
              onChange={(event) => setForm({ ...form, productId: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">SKU</label>
            <input
              value={form.sku}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Size</label>
            <input
              value={form.size}
              onChange={(event) => setForm({ ...form, size: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Color</label>
            <input
              value={form.color}
              onChange={(event) => setForm({ ...form, color: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Price (EUR)</label>
            <input
              type="number"
              value={form.priceEur}
              onChange={(event) => setForm({ ...form, priceEur: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Backorder</label>
            <select
              value={form.backorderPolicy}
              onChange={(event) => setForm({ ...form, backorderPolicy: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              {BACKORDER_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-300">Active</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={submitForm}
            className="px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
          >
            {editingId ? "Save Changes" : "Create Variant"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bebas text-2xl">Existing Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            {!bulkEditMode ? (
              <button
                onClick={() => setBulkEditMode(true)}
                className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold transition"
              >
                Bulk Edit Stock
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveBulkStockUpdates}
                  disabled={savingBulk}
                  className="px-4 py-2 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-xs hover:bg-white transition disabled:opacity-50"
                >
                  {savingBulk ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelBulkEdit}
                  disabled={savingBulk}
                  className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-red-400 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-400">Low stock (&lt; {LOW_STOCK_THRESHOLD})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-slate-400">In stock</span>
              </div>
            </div>
          </div>
        </div>

        {bulkEditMode && (
          <div className="bg-slate-900/60 border border-gold/30 p-4 text-sm">
            <p className="text-slate-300">
              <span className="text-gold font-semibold">Bulk Edit Mode:</span> Use the +/- buttons or type directly in the stock field to update multiple variants at once.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading variants...</p>
        ) : (
          <div className="space-y-4">
            {variants.map((variant) => {
              const isLowStock = variant.isActive && variant.stock < LOW_STOCK_THRESHOLD;
              const isOutOfStock = variant.isActive && variant.stock === 0;
              const hasStockChange = bulkStockUpdates[variant.id] !== undefined;

              return (
                <div
                  key={variant.id}
                  className={`border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between transition ${
                    isLowStock
                      ? "border-red-500/30 bg-red-500/5"
                      : hasStockChange
                      ? "border-gold/30 bg-gold/5"
                      : "border-white/10 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isOutOfStock ? (
                        <span className="flex h-3 w-3 rounded-full bg-red-600" title="Out of stock">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                        </span>
                      ) : isLowStock ? (
                        <span className="flex h-3 w-3 rounded-full bg-red-500" title="Low stock">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                        </span>
                      ) : variant.isActive ? (
                        <span className="h-3 w-3 rounded-full bg-green-500" title="In stock"></span>
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-slate-600" title="Inactive"></span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bebas text-xl">{variant.sku}</h3>
                        {isLowStock && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                            {isOutOfStock ? "Out of Stock" : "Low Stock"}
                          </span>
                        )}
                        {!variant.isActive && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-slate-700 text-slate-400 border border-slate-600">
                            Inactive
                          </span>
                        )}
                        {hasStockChange && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-gold/20 text-gold border border-gold/30">
                            Modified
                          </span>
                        )}
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {variant.product?.name || "No product"}
                        {variant.size && ` · Size ${variant.size}`}
                        {variant.color && ` · ${variant.color}`}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {bulkEditMode ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustStock(variant.id, -1)}
                              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-gold text-slate-400 hover:text-white transition"
                              disabled={!variant.isActive}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={bulkStockUpdates[variant.id] ?? variant.stock}
                              onChange={(e) => handleBulkStockChange(variant.id, e.target.value)}
                              disabled={!variant.isActive}
                              className={`w-16 bg-slate-950 border px-2 py-1 text-center text-white focus:outline-none focus:border-gold disabled:opacity-50 ${
                                hasStockChange ? "border-gold" : "border-white/10"
                              }`}
                            />
                            <button
                              onClick={() => adjustStock(variant.id, 1)}
                              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-gold text-slate-400 hover:text-white transition"
                              disabled={!variant.isActive}
                            >
                              +
                            </button>
                            <span className="text-slate-500 ml-2">
                              was {variant.stock}
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className={`${isLowStock ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                              Stock: {variant.stock}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-400">EUR {variant.priceEur ?? "—"}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(variant)}
                      disabled={bulkEditMode}
                      className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeVariant(variant.id)}
                      disabled={bulkEditMode}
                      className="px-4 py-2 border border-red-500/40 text-xs uppercase tracking-[0.2em] text-red-300 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

