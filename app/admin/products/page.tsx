"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toastSuccess, toastError } from "@/components/admin";

const BACKORDER_POLICIES = ["DISALLOW", "ALLOW"] as const;
const ITEMS_PER_PAGE = 20;

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
  media?: {
    id: string;
    objectKey: string;
    bucket: string;
    url?: string | null;
    alt?: string | null;
    sortOrder?: number | null;
  }[];
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

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Build query params
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (collectionFilter) {
      params.set("collectionId", collectionFilter);
    }
    if (categoryFilter) {
      params.set("categoryId", categoryFilter);
    }

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
    setPagination(productsData.pagination || pagination);
    setCollections(collectionsData.data || []);
    setCategories(categoriesData.data || []);
    setLoading(false);
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, collectionFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const errorMsg = data?.error || "Save failed.";
      setError(errorMsg);
      toastError(errorMsg);
      return;
    }

    toastSuccess(editingId ? "Product updated successfully" : "Product created successfully");
    resetForm();
    loadData();
  };

  const clearUploadError = (productId: string) => {
    setUploadErrors((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const setUploadError = (productId: string, message: string) => {
    setUploadErrors((prev) => ({ ...prev, [productId]: message }));
  };

  const uploadProductFiles = async (productId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    clearUploadError(productId);
    setUploadingId(productId);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setUploadError(productId, "Only image uploads are supported.");
          continue;
        }

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

        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to prepare upload.");
        }

        const { uploadUrl, objectKey, bucket } = await presignRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Upload failed.");
        }

        const createRes = await fetch("/api/admin/media", {
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

        if (!createRes.ok) {
          const data = await createRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to save media.");
        }
      }
    } catch (uploadError) {
      setUploadError(productId, (uploadError as Error).message);
    } finally {
      setUploadingId((current) => (current === productId ? null : current));
      loadData();
    }
  };

  const removeMedia = async (mediaId: string, productId: string) => {
    if (!confirm("Remove this image?")) return;
    await fetch(`/api/admin/media/${mediaId}`, { method: "DELETE", credentials: "include" });
    loadData();
    clearUploadError(productId);
  };

  const removeProduct = async (id: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toastSuccess(`"${productName}" deleted successfully`);
      loadData();
    } else {
      toastError("Failed to delete product");
    }
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
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bebas text-2xl">Existing Products</h2>
            <p className="text-sm text-slate-400">
              Showing {products.length} of {pagination.total} products
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-slate-900 border border-white/10 px-4 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="featured">Featured</option>
            </select>

            {/* Collection Filter */}
            <select
              value={collectionFilter}
              onChange={(e) => {
                setCollectionFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-slate-900 border border-white/10 px-4 py-2 text-white text-sm"
            >
              <option value="">All Collections</option>
              <option value="none">Always-on (no collection)</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-slate-900 border border-white/10 px-4 py-2 text-white text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || collectionFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCollectionFilter("");
                  setCategoryFilter("");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border border-white/10 bg-slate-900/40">
            <p className="text-slate-400 mb-2">No products found</p>
            <p className="text-sm text-slate-500">
              {searchQuery ? "Try adjusting your search or filters" : "Create your first product above"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border p-4 flex flex-col gap-4 transition ${
                    product.isActive ? "border-white/10 bg-slate-900/40" : "border-slate-700 bg-slate-900/20 opacity-70"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bebas text-xl">{product.name}</h3>
                        {!product.isActive && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-slate-700 text-slate-400">
                            Inactive
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-gold/20 text-gold border border-gold/30">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.slug}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>EUR {product.basePriceEur}</span>
                        <span>•</span>
                        <span>{product.collection?.name || "Always-on"}</span>
                        <span>•</span>
                        <span>{product.variants?.length ?? 0} variants</span>
                        {product.category && (
                          <>
                            <span>•</span>
                            <span>{product.category.name}</span>
                          </>
                        )}
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
                        onClick={() => removeProduct(product.id, product.name)}
                        className="px-4 py-2 border border-red-500/40 text-xs uppercase tracking-[0.2em] text-red-300 hover:border-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Images</span>
                    <label className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] text-slate-200 hover:border-gold cursor-pointer">
                      {uploadingId === product.id ? "Uploading..." : "Upload Images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingId === product.id}
                        onChange={(event) => {
                          const files = event.currentTarget.files;
                          event.currentTarget.value = "";
                          uploadProductFiles(product.id, files);
                        }}
                      />
                    </label>
                  </div>
                  {uploadErrors[product.id] && (
                    <p className="mt-3 text-xs text-red-400">{uploadErrors[product.id]}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {product.media && product.media.length > 0 ? (
                      product.media.map((media) => (
                        <div
                          key={media.id}
                          className="relative h-20 w-20 overflow-hidden border border-white/10 bg-slate-950"
                        >
                          {media.url ? (
                            <img
                              src={media.url}
                              alt={media.alt || product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-500">
                              No preview
                            </div>
                          )}
                          <button
                            onClick={() => removeMedia(media.id, product.id)}
                            className="absolute top-1 right-1 bg-slate-950/80 text-white text-[10px] px-1 py-0.5 border border-white/10 hover:border-red-400"
                          >
                            x
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
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <p className="text-sm text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 border border-white/10 text-sm hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-2">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-slate-500">...</span>
                        )}
                        <button
                          onClick={() => setPagination((prev) => ({ ...prev, page }))}
                          className={`w-10 h-10 text-sm font-medium transition ${
                            page === pagination.page
                              ? "bg-gold text-slate-950"
                              : "border border-white/10 hover:border-gold text-white"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 border border-white/10 text-sm hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

