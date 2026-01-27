"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STATUSES = ["UPCOMING", "LIVE", "ENDED"] as const;
const SALE_MODES = ["DROP", "ALWAYS_ON"] as const;
const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;

type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  saleMode: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isVisible: boolean;
  backorderPolicy?: string | null;
  products?: { id: string }[];
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "UPCOMING",
  saleMode: "DROP",
  startsAt: "",
  endsAt: "",
  isVisible: true,
  backorderPolicy: "DISALLOW",
};

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCollections = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/collections", { credentials: "include" });
    if (!res.ok) {
      setError("Failed to load collections.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCollections(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setForm({
      name: collection.name || "",
      slug: collection.slug || "",
      description: collection.description || "",
      status: collection.status || "UPCOMING",
      saleMode: collection.saleMode || "DROP",
      startsAt: collection.startsAt ? collection.startsAt.slice(0, 16) : "",
      endsAt: collection.endsAt ? collection.endsAt.slice(0, 16) : "",
      isVisible: collection.isVisible ?? true,
      backorderPolicy: collection.backorderPolicy || "DISALLOW",
    });
  };

  const submitForm = async () => {
    setError(null);
    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    const res = await fetch(
      editingId ? `/api/admin/collections/${editingId}` : "/api/admin/collections",
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
    loadCollections();
  };

  const removeCollection = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE", credentials: "include" });
    loadCollections();
  };

  const formTitle = useMemo(
    () => (editingId ? "Edit Collection" : "Create Collection"),
    [editingId]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Collections</h1>
          <p className="text-slate-400">Manage drops and always-on collections.</p>
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
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sale Mode</label>
            <select
              value={form.saleMode}
              onChange={(event) => setForm({ ...form, saleMode: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              {SALE_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Starts At</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Ends At</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
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
              checked={form.isVisible}
              onChange={(event) => setForm({ ...form, isVisible: event.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-300">Visible in storefront</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={submitForm}
            className="px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
          >
            {editingId ? "Save Changes" : "Create Collection"}
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
        <h2 className="font-bebas text-2xl">Existing Collections</h2>
        {loading ? (
          <p className="text-slate-400">Loading collections...</p>
        ) : (
          <div className="space-y-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bebas text-xl">{collection.name}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{collection.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{collection.status}</span>
                    <span>•</span>
                    <span>{collection.saleMode}</span>
                    <span>•</span>
                    <span>{collection.products?.length ?? 0} products</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(collection)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeCollection(collection.id)}
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

