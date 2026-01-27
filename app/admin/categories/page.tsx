"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string }[];
};

const emptyForm = {
  name: "",
  slug: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories", { credentials: "include" });
    if (!res.ok) {
      setError("Failed to load categories.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCategories(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      parentId: category.parent?.id || "",
      sortOrder: category.sortOrder?.toString() || "0",
      isActive: category.isActive ?? true,
    });
  };

  const submitForm = async () => {
    setError(null);
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      parentId: form.parentId || null,
    };

    const res = await fetch(
      editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
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
    loadCategories();
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
    loadCategories();
  };

  const formTitle = useMemo(
    () => (editingId ? "Edit Category" : "Create Category"),
    [editingId]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Categories</h1>
          <p className="text-slate-400">Group products for navigation and filters.</p>
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
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Parent</label>
            <select
              value={form.parentId}
              onChange={(event) => setForm({ ...form, parentId: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              <option value="">None</option>
              {categories
                .filter((category) => category.id !== editingId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
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
            {editingId ? "Save Changes" : "Create Category"}
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
        <h2 className="font-bebas text-2xl">Existing Categories</h2>
        {loading ? (
          <p className="text-slate-400">Loading categories...</p>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bebas text-xl">{category.name}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{category.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Sort {category.sortOrder}</span>
                    <span>•</span>
                    <span>{category.parent?.name || "No parent"}</span>
                    <span>•</span>
                    <span>{category.children?.length ?? 0} children</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeCategory(category.id)}
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

