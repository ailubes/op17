"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  EntityCard,
  EntityList,
  ActionButton,
  MobileBottomSheet,
  toastSuccess,
  toastError,
} from "@/components/admin";

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;
const LOW_STOCK_THRESHOLD = 5;

type Product = { id: string; name: string };
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
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    setIsFormOpen(false);
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
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setIsFormOpen(true);
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

    toastSuccess(editingId ? "Variant updated successfully" : "Variant created successfully");
    resetForm();
    loadData();
  };

  const removeVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;
    await fetch(`/api/admin/variants/${id}`, { method: "DELETE", credentials: "include" });
    toastSuccess("Variant deleted");
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
      .map(([id, value]) => ({ id, stock: parseInt(value, 10) }));

    if (updates.length === 0) {
      setBulkEditMode(false);
      setSavingBulk(false);
      return;
    }

    try {
      for (const update of updates) {
        if (Number.isNaN(update.stock)) continue;
        await fetch(`/api/admin/variants/${update.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: update.stock }),
          credentials: "include",
        });
      }

      setBulkStockUpdates({});
      setBulkEditMode(false);
      toastSuccess("Stock updated successfully");
      await loadData();
    } catch (err) {
      toastError("Bulk update failed");
    } finally {
      setSavingBulk(false);
    }
  };

  const cancelBulkEdit = () => {
    setBulkEditMode(false);
    setBulkStockUpdates({});
  };

  const formTitle = useMemo(() => (editingId ? "Edit Variant" : "Create Variant"), [editingId]);

  const getStockStatus = (variant: Variant) => {
    const isOutOfStock = variant.isActive && variant.stock === 0;
    const isLowStock = variant.isActive && variant.stock < LOW_STOCK_THRESHOLD && variant.stock > 0;
    if (isOutOfStock) return { variant: "error" as const, label: "Out of Stock" };
    if (isLowStock) return { variant: "error" as const, label: "Low Stock" };
    if (!variant.isActive) return { variant: "default" as const, label: "Inactive" };
    return { variant: "success" as const, label: "In Stock" };
  };

  const formContent = (
    <div className="p-4 space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Product</label>
        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">SKU</label>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Size</label>
          <input
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Color</label>
          <input
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Price (EUR)</label>
          <input
            type="number"
            value={form.priceEur}
            onChange={(e) => setForm({ ...form, priceEur: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Stock</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Backorder</label>
          <select
            value={form.backorderPolicy}
            onChange={(e) => setForm({ ...form, backorderPolicy: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          >
            {BACKORDER_POLICIES.map((policy) => (
              <option key={policy} value={policy}>{policy}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-5 w-5 rounded border-white/10 bg-slate-950 text-gold focus:ring-gold"
            />
            <span className="text-sm text-slate-300">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" onClick={submitForm} fullWidth>
          {editingId ? "Save Changes" : "Create Variant"}
        </ActionButton>
        {editingId && (
          <ActionButton variant="ghost" onClick={resetForm}>
            Cancel
          </ActionButton>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl sm:text-5xl">Variants</h1>
          <p className="text-slate-400 text-sm sm:text-base">Create SKUs, manage stock, and set variant pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton
            variant="primary"
            onClick={handleCreate}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Variant
          </ActionButton>
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Desktop Form */}
      <section className="hidden lg:block border border-white/10 bg-slate-900/60 rounded-lg p-6">
        <h2 className="font-bebas text-2xl mb-4">{formTitle}</h2>
        {formContent}
      </section>

      {/* Mobile Form Bottom Sheet */}
      <MobileBottomSheet isOpen={isFormOpen} onClose={resetForm} title={formTitle}>
        {formContent}
      </MobileBottomSheet>

      {/* Bulk Edit Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-bebas text-xl sm:text-2xl text-slate-300">Existing Variants</h2>

        {!bulkEditMode ? (
          <ActionButton variant="outline" size="sm" onClick={() => setBulkEditMode(true)}>
            Bulk Edit Stock
          </ActionButton>
        ) : (
          <div className="flex items-center gap-2">
            <ActionButton
              variant="primary"
              size="sm"
              onClick={saveBulkStockUpdates}
              disabled={savingBulk}
            >
              {savingBulk ? "Saving..." : "Save Changes"}
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={cancelBulkEdit} disabled={savingBulk}>
              Cancel
            </ActionButton>
          </div>
        )}
      </div>

      {bulkEditMode && (
        <div className="bg-slate-900/60 border border-gold/30 rounded-lg p-4 text-sm">
          <p className="text-slate-300">
            <span className="text-gold font-semibold">Bulk Edit Mode:</span> Use +/- buttons or type directly to update multiple variants at once.
          </p>
        </div>
      )}

      {/* Stock Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-400">Low/Out of stock (&lt; {LOW_STOCK_THRESHOLD})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-slate-400">In stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-600"></span>
          <span className="text-slate-400">Inactive</span>
        </div>
      </div>

      {/* Variants List */}
      <EntityList loading={loading} emptyMessage="No variants yet. Create your first variant above.">
        {variants.map((variant) => {
          const stockStatus = getStockStatus(variant);
          const hasStockChange = bulkStockUpdates[variant.id] !== undefined;
          const displayStock = hasStockChange ? bulkStockUpdates[variant.id] : variant.stock;

          return (
            <EntityCard
              key={variant.id}
              title={variant.sku}
              subtitle={`${variant.product?.name || "No product"}${variant.size ? ` · Size ${variant.size}` : ""}${variant.color ? ` · ${variant.color}` : ""}`}
              isInactive={!variant.isActive}
              badges={[stockStatus, ...(hasStockChange ? [{ variant: "warning" as const, label: "Modified" }] : [])]}
              meta={[
                { label: "Price", value: `EUR ${variant.priceEur ?? "—"}` },
              ]}
              actions={
                bulkEditMode ? null : (
                  <>
                    <ActionButton variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                      Edit
                    </ActionButton>
                    <ActionButton variant="danger" size="sm" onClick={() => removeVariant(variant.id)}>
                      Delete
                    </ActionButton>
                  </>
                )
              }
            >
              {bulkEditMode && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => adjustStock(variant.id, -1)}
                      disabled={!variant.isActive || savingBulk}
                    >
                      −
                    </ActionButton>
                    <input
                      type="number"
                      min="0"
                      value={displayStock}
                      onChange={(e) => handleBulkStockChange(variant.id, e.target.value)}
                      disabled={!variant.isActive || savingBulk}
                      className={`w-20 bg-slate-950 border px-3 py-2 text-center text-white rounded-lg focus:outline-none focus:border-gold ${
                        hasStockChange ? "border-gold" : "border-white/10"
                      }`}
                    />
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => adjustStock(variant.id, 1)}
                      disabled={!variant.isActive || savingBulk}
                    >
                      +
                    </ActionButton>
                    {hasStockChange && (
                      <span className="text-xs text-slate-500">was {variant.stock}</span>
                    )}
                  </div>
                </div>
              )}
            </EntityCard>
          );
        })}
      </EntityList>
    </div>
  );
}
