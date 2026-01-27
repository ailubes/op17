"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;

type Collection = {
  id: string;
  name: string;
  saleMode: string;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type?: string | null;
  gender?: string | null;
  sport?: string | null;
  basePriceEur: number;
  isActive: boolean;
  isFeatured: boolean;
  backorderPolicy?: string | null;
  collection?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  variants?: { id: string }[];
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  type: "",
  gender: "",
  sport: "",
  categoryId: "",
  collectionId: "",
  basePriceEur: "",
  isActive: true,
  isFeatured: false,
  backorderPolicy: "DISALLOW",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [productsRes, collectionsRes, categoriesRes] = await Promise.all([
      fetch("/api/admin/products", { credentials: "include" }),
      fetch("/api/admin/collections", { credentials: "include" }),
      fetch("/api/admin/categories", { credentials: "include" }),
    ]);

    if (!productsRes.ok) {
      setError("Failed to load products.");
      setLoading(false);
      return;
    }

    const productsData = await productsRes.json();
    const collectionsData = collectionsRes.ok ? await collectionsRes.json() : { data: [] };
    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { data: [] };

    setProducts(productsData.data || []);
    setCollections(collectionsData.data || []);
    setCategories(categoriesData.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      type: product.type || "",
      gender: product.gender || "",
      sport: product.sport || "",
      categoryId: product.category?.id || "",
      collectionId: product.collection?.id || "",
      basePriceEur: product.basePriceEur?.toString() || "",
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      backorderPolicy: product.backorderPolicy || "DISALLOW",
    });
  };

  const submitForm = async () => {
    setError(null);
    const payload = {
      ...form,
      basePriceEur: form.basePriceEur === "" ? undefined : Number(form.basePriceEur),
      categoryId: form.categoryId || null,
      collectionId: form.collectionId || null,
    };

    const res = await fetch(
      editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
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

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    loadData();
  };

  const formTitle = useMemo(
    () => (editingId ? "Edit Product" : "Create Product"),
    [editingId]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Products</h1>
          <p className="text-slate-400">Create items, assign categories and collections.</p>
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
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Slug</label>
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
            <input
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Gender</label>
            <input
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sport</label>
            <input
              value={form.sport}
              onChange={(event) => setForm({ ...form, sport: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</label>
            <select
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Collection</label>
            <select
              value={form.collectionId}
              onChange={(event) => setForm({ ...form, collectionId: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              <option value="">Always-on (none)</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Base Price (EUR)</label>
            <input
              type="number"
              value={form.basePriceEur}
              onChange={(event) => setForm({ ...form, basePriceEur: event.target.value })}
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
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-300">Featured</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={submitForm}
            className="px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
          >
            {editingId ? "Save Changes" : "Create Product"}
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
        <h2 className="font-bebas text-2xl">Existing Products</h2>
        {loading ? (
          <p className="text-slate-400">Loading products...</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bebas text-xl">{product.name}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>EUR {product.basePriceEur}</span>
                    <span>•</span>
                    <span>{product.collection?.name || "Always-on"}</span>
                    <span>•</span>
                    <span>{product.variants?.length ?? 0} variants</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeProduct(product.id)}
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

