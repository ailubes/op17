"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;

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
        <h2 className="font-bebas text-2xl">Existing Variants</h2>
        {loading ? (
          <p className="text-slate-400">Loading variants...</p>
        ) : (
          <div className="space-y-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bebas text-xl">{variant.sku}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {variant.product?.name || "No product"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Stock {variant.stock}</span>
                    <span>•</span>
                    <span>EUR {variant.priceEur ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(variant)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeVariant(variant.id)}
                    className="px-4 py-2 border border-red-500/40 text-xs uppercase tracking-[0.2em] text-red-300 hover:border-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

