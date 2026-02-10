"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  EntityCard,
  EntityList,
  ActionButton,
  MobileBottomSheet,
  FilterBar,
  toastSuccess,
  toastError,
} from "@/components/admin";

const STATUSES = ["UPCOMING", "LIVE", "ENDED"] as const;
const SALE_MODES = ["DROP", "ALWAYS_ON"] as const;
const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;

const statusBadges: Record<string, { variant: "default" | "success" | "warning" | "error" | "info" | "purple"; label: string }> = {
  UPCOMING: { variant: "warning", label: "Upcoming" },
  LIVE: { variant: "success", label: "Live" },
  ENDED: { variant: "default", label: "Ended" },
};

const saleModeBadges: Record<string, { variant: "default" | "success" | "warning" | "error" | "info" | "purple"; label: string }> = {
  DROP: { variant: "purple", label: "Drop" },
  ALWAYS_ON: { variant: "info", label: "Always On" },
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
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saleModeFilter, setSaleModeFilter] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
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

    // Sort: UPCOMING first, then LIVE, then ENDED
    filtered.sort((a, b) => {
      const statusOrder = { UPCOMING: 0, LIVE: 1, ENDED: 2 };
      const statusDiff =
        statusOrder[a.status as keyof typeof statusOrder] -
        statusOrder[b.status as keyof typeof statusOrder];
      if (statusDiff !== 0) return statusDiff;

      if (a.startsAt && b.startsAt) {
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredCollections(filtered);
  }, [collections, debouncedSearch, statusFilter, saleModeFilter]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setIsFormOpen(false);
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
    const res = await fetch(`/api/admin/collections/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
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

  const formContent = (
    <div className="p-4 space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold"
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
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
            onChange={(e) => setForm({ ...form, saleMode: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          >
            {SALE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode === "ALWAYS_ON" ? "Always On" : "Drop"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Starts At</label>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Ends At</label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
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
              <option key={policy} value={policy}>
                {policy}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
              className="h-5 w-5 rounded border-white/10 bg-slate-950 text-gold focus:ring-gold"
            />
            <span className="text-sm text-slate-300">Visible in storefront</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" onClick={submitForm} fullWidth>
          {editingId ? "Save Changes" : "Create Collection"}
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
          <h1 className="font-bebas text-4xl sm:text-5xl">Collections</h1>
          <p className="text-slate-400 text-sm sm:text-base">Manage drops and always-on collections.</p>
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
            New Collection
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

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or slug..."
        filters={[
          {
            value: statusFilter,
            options: [
              { value: "all", label: "All", count: collections.length },
              { value: "UPCOMING", label: "Upcoming", count: collections.filter((c) => c.status === "UPCOMING").length },
              { value: "LIVE", label: "Live", count: collections.filter((c) => c.status === "LIVE").length },
              { value: "ENDED", label: "Ended", count: collections.filter((c) => c.status === "ENDED").length },
            ],
            onChange: setStatusFilter,
          },
          {
            value: saleModeFilter,
            options: [
              { value: "all", label: "All Modes" },
              { value: "DROP", label: "Drop" },
              { value: "ALWAYS_ON", label: "Always On" },
            ],
            onChange: setSaleModeFilter,
          },
        ]}
      />

      {/* Collections List */}
      <EntityList
        title="Collections"
        count={filteredCollections.length}
        total={collections.length}
        loading={loading}
        emptyMessage={
          debouncedSearch
            ? `No collections found for "${debouncedSearch}"`
            : statusFilter !== "all" || saleModeFilter !== "all"
            ? "No collections match your filters"
            : "Create your first collection above"
        }
      >
        {filteredCollections.map((collection) => (
          <EntityCard
            key={collection.id}
            title={collection.name}
            subtitle={collection.slug}
            isInactive={!collection.isVisible}
            badges={[
              statusBadges[collection.status],
              saleModeBadges[collection.saleMode],
              ...(!collection.isVisible ? [{ variant: "default" as const, label: "Hidden" }] : []),
            ]}
            meta={[
              { label: "Products", value: (collection.products?.length ?? 0).toString() },
              ...(collection.startsAt
                ? [{ label: "Starts", value: new Date(collection.startsAt).toLocaleDateString() }]
                : []),
              ...(collection.endsAt
                ? [{ label: "Ends", value: new Date(collection.endsAt).toLocaleDateString() }]
                : []),
            ]}
            actions={
              <>
                <ActionButton variant="outline" size="sm" onClick={() => handleEdit(collection)}>
                  Edit
                </ActionButton>
                <ActionButton
                  variant="danger"
                  size="sm"
                  onClick={() => removeCollection(collection.id, collection.name)}
                >
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
