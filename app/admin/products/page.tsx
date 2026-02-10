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

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;
const ITEMS_PER_PAGE = 20;

type Collection = { id: string; name: string; saleMode: string };
type Category = { id: string; name: string };
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
  media?: { id: string; objectKey: string; bucket: string; url?: string | null; alt?: string | null }[];
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", ITEMS_PER_PAGE.toString());
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (collectionFilter) params.set("collectionId", collectionFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);

    const [productsRes, collectionsRes, categoriesRes] = await Promise.all([
      fetch(`/api/admin/products?${params.toString()}`, { credentials: "include" }),
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
    setTotalPages(productsData.pagination?.totalPages || 1);
    setTotal(productsData.pagination?.total || 0);
    setCollections(collectionsData.data || []);
    setCategories(categoriesData.data || []);
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, collectionFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setIsFormOpen(false);
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
      const errorMsg = data?.error || "Save failed.";
      setError(errorMsg);
      toastError(errorMsg);
      return;
    }

    toastSuccess(editingId ? "Product updated successfully" : "Product created successfully");
    resetForm();
    loadData();
  };

  const uploadProductFiles = async (productId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(productId);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const presignRes = await fetch("/api/admin/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            entityType: "product",
            entityId: productId,
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!presignRes.ok) continue;
        const { uploadUrl, objectKey, bucket } = await presignRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) continue;

        await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            entityType: "product",
            entityId: productId,
            objectKey,
            bucket,
            mimeType: file.type,
          }),
        });
      }
    } finally {
      setUploadingId(null);
      loadData();
    }
  };

  const removeMedia = async (mediaId: string, productId: string) => {
    if (!confirm("Remove this image?")) return;
    await fetch(`/api/admin/media/${mediaId}`, { method: "DELETE", credentials: "include" });
    loadData();
  };

  const removeProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toastSuccess(`"${name}" deleted successfully`);
      loadData();
    } else {
      toastError("Failed to delete product");
    }
  };

  const formTitle = useMemo(() => (editingId ? "Edit Product" : "Create Product"), [editingId]);

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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
          <input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
            placeholder="e.g. T-Shirt"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Gender</label>
          <input
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
            placeholder="e.g. Unisex"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sport</label>
          <input
            value={form.sport}
            onChange={(e) => setForm({ ...form, sport: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
            placeholder="e.g. Powerlifting"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Collection</label>
          <select
            value={form.collectionId}
            onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          >
            <option value="">Always-on (none)</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Base Price (EUR)</label>
          <input
            type="number"
            value={form.basePriceEur}
            onChange={(e) => setForm({ ...form, basePriceEur: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
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
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-5 w-5 rounded border-white/10 bg-slate-950 text-gold focus:ring-gold"
          />
          <span className="text-sm text-slate-300">Active</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="h-5 w-5 rounded border-white/10 bg-slate-950 text-gold focus:ring-gold"
          />
          <span className="text-sm text-slate-300">Featured</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" onClick={submitForm} fullWidth>
          {editingId ? "Save Changes" : "Create Product"}
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
          <h1 className="font-bebas text-4xl sm:text-5xl">Products</h1>
          <p className="text-slate-400 text-sm sm:text-base">Create items, assign categories and collections.</p>
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
            New Product
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
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "featured", label: "Featured" },
            ],
            onChange: (val) => { setStatusFilter(val); setPage(1); },
          },
          {
            value: collectionFilter,
            options: [
              { value: "", label: "All Collections" },
              { value: "none", label: "Always-on" },
              ...collections.map((c) => ({ value: c.id, label: c.name })),
            ],
            onChange: (val) => { setCollectionFilter(val); setPage(1); },
          },
          {
            value: categoryFilter,
            options: [
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ],
            onChange: (val) => { setCategoryFilter(val); setPage(1); },
          },
        ]}
      />

      {/* Products List */}
      <EntityList
        title="Products"
        count={products.length}
        total={total}
        loading={loading}
        emptyMessage={searchQuery ? `No products found for "${searchQuery}"` : "Create your first product above"}
      >
        {products.map((product) => (
          <div key={product.id} className="border border-white/10 bg-slate-900/40 rounded-lg overflow-hidden">
            <EntityCard
              title={product.name}
              subtitle={product.slug}
              isInactive={!product.isActive}
              badges={[
                ...(product.isFeatured ? [{ variant: "warning" as const, label: "Featured" }] : []),
                ...(!product.isActive ? [{ variant: "default" as const, label: "Inactive" }] : []),
              ]}
              meta={[
                { label: "Price", value: `EUR ${product.basePriceEur}` },
                { label: "Collection", value: product.collection?.name || "Always-on" },
                { label: "Variants", value: (product.variants?.length ?? 0).toString() },
                ...(product.category ? [{ label: "Category", value: product.category.name }] : []),
              ]}
              actions={
                <>
                  <ActionButton variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    Edit
                  </ActionButton>
                  <ActionButton variant="danger" size="sm" onClick={() => removeProduct(product.id, product.name)}>
                    Delete
                  </ActionButton>
                </>
              }
            />

            {/* Images Section */}
            <div className="px-4 pb-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Images</span>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingId === product.id}
                    onChange={(e) => {
                      const files = e.currentTarget.files;
                      e.currentTarget.value = "";
                      uploadProductFiles(product.id, files);
                    }}
                  />
                  <span className="inline-flex items-center px-3 py-1.5 border border-white/10 text-xs uppercase tracking-wider rounded hover:border-gold transition-colors">
                    {uploadingId === product.id ? "Uploading..." : "Upload"}
                  </span>
                </label>
              </div>
              {uploadErrors[product.id] && (
                <p className="text-xs text-red-400 mb-2">{uploadErrors[product.id]}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {product.media && product.media.length > 0 ? (
                  product.media.map((media) => (
                    <div key={media.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-slate-950">
                      {media.url ? (
                        <img src={media.url} alt={media.alt || product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No preview</div>
                      )}
                      <button
                        onClick={() => removeMedia(media.id, product.id)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-slate-950/80 text-white text-[10px] rounded flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No images yet.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </EntityList>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </ActionButton>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page;
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition ${
                      pageNum === page
                        ? "bg-gold text-slate-950"
                        : "border border-white/10 hover:border-gold text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
