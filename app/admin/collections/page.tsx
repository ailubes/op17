"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toastSuccess, toastError } from "@/components/admin";

const STATUSES = ["UPCOMING", "LIVE", "ENDED"] as const;
const SALE_MODES = ["DROP", "ALWAYS_ON"] as const;
const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;

const statusColors: Record<string, string> = {
  UPCOMING: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  LIVE: "bg-green-500/10 border-green-500/30 text-green-400",
  ENDED: "bg-slate-700/50 border-slate-600 text-slate-400",
};

const saleModeColors: Record<string, string> = {
  DROP: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  ALWAYS_ON: "bg-ukraine-blue/10 border-ukraine-blue/30 text-ukraine-blue",
};

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
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saleModeFilter, setSaleModeFilter] = useState<string>("all");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCollections = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Filter collections client-side
  useEffect(() => {
    let filtered = [...collections];

    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.slug.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (saleModeFilter !== "all") {
      filtered = filtered.filter((c) => c.saleMode === saleModeFilter);
    }

    // Sort by start date (upcoming first), then by name
    filtered.sort((a, b) => {
      // Prioritize by status: UPCOMING first, then LIVE, then ENDED
      const statusOrder = { UPCOMING: 0, LIVE: 1, ENDED: 2 };
      const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      if (statusDiff !== 0) return statusDiff;

      // Then by start date if available
      if (a.startsAt && b.startsAt) {
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      }

      // Finally by name
      return a.name.localeCompare(b.name);
    });

    setFilteredCollections(filtered);
  }, [collections, debouncedSearch, statusFilter, saleModeFilter]);

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
      const errorMsg = data?.error || "Save failed.";
      setError(errorMsg);
      toastError(errorMsg);
      return;
    }

    toastSuccess(editingId ? "Collection updated successfully" : "Collection created successfully");
    resetForm();
    loadCollections();
  };

  const removeCollection = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toastSuccess(`"${name}" deleted successfully`);
      loadCollections();
    } else {
      toastError("Failed to delete collection");
    }
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
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bebas text-2xl">Existing Collections</h2>
            <p className="text-sm text-slate-400">
              Showing {filteredCollections.length} of {collections.length} collections
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <input
                type="text"
                placeholder="Search by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-4 py-2 pl-10 text-white text-sm focus:outline-none focus:border-gold"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 px-4 py-2 text-white text-sm"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Sale Mode Filter */}
            <select
              value={saleModeFilter}
              onChange={(e) => setSaleModeFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 px-4 py-2 text-white text-sm"
            >
              <option value="all">All Modes</option>
              {SALE_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode === "ALWAYS_ON" ? "Always On" : "Drop"}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || saleModeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSaleModeFilter("all");
                }}
                className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading collections...</p>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12 border border-white/10 bg-slate-900/40">
            <p className="text-slate-400 mb-2">No collections found</p>
            <p className="text-sm text-slate-500">
              {searchQuery || statusFilter !== "all" || saleModeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first collection above"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bebas text-xl">{collection.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${statusColors[collection.status]}`}>
                      {collection.status}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${saleModeColors[collection.saleMode]}`}>
                      {collection.saleMode === "ALWAYS_ON" ? "Always On" : "Drop"}
                    </span>
                    {!collection.isVisible && (
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-slate-700 text-slate-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{collection.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{collection.products?.length ?? 0} products</span>
                    {collection.startsAt && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>
                          Starts: {new Date(collection.startsAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {collection.endsAt && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>
                          Ends: {new Date(collection.endsAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
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
                    onClick={() => removeCollection(collection.id, collection.name)}
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

