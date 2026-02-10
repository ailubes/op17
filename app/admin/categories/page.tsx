"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EntityCard, EntityList, ActionButton, MobileBottomSheet } from "@/components/admin";

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
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    setIsFormOpen(false);
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

  const formContent = (
    <div className="p-4 space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          placeholder="Category name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Slug</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          placeholder="category-slug"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Parent</label>
        <select
          value={form.parentId}
          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
        >
          <option value="">None</option>
          {categories
            .filter((c) => c.id !== editingId)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
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
          {editingId ? "Save Changes" : "Create Category"}
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
          <h1 className="font-bebas text-4xl sm:text-5xl">Categories</h1>
          <p className="text-slate-400 text-sm sm:text-base">Group products for navigation and filters.</p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton variant="primary" onClick={handleCreate} icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }>
            New Category
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

      {/* Categories List */}
      <EntityList
        title="Existing Categories"
        count={categories.length}
        loading={loading}
        emptyMessage="No categories yet. Create your first category above."
      >
        {categories.map((category) => (
          <EntityCard
            key={category.id}
            title={category.name}
            subtitle={category.slug}
            isInactive={!category.isActive}
            meta={[
              { label: "Sort", value: category.sortOrder.toString() },
              { label: "Parent", value: category.parent?.name || "None" },
              { label: "Children", value: (category.children?.length ?? 0).toString() },
            ]}
            actions={
              <>
                <ActionButton variant="outline" size="sm" onClick={() => handleEdit(category)}>
                  Edit
                </ActionButton>
                <ActionButton variant="danger" size="sm" onClick={() => removeCategory(category.id)}>
                  Delete
                </ActionButton>
              </>
            }
          />
        ))}
      </EntityList>
    </div>
  );
}
