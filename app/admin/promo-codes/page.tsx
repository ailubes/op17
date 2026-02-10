"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PromoCode, PromoType } from "@prisma/client";

type PromoCodeWithOrders = PromoCode & {
  orders?: { id: string; orderNumber: string; totalEur: number; status: string; createdAt: string; email: string }[];
};

const emptyForm = {
  code: "",
  type: "PERCENT" as PromoType,
  value: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
  maxRedemptions: "",
  minSubtotalEur: "",
};

const emptyBatchForm = {
  prefix: "",
  count: "10",
  suffixLength: "6",
  type: "PERCENT" as PromoType,
  value: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
  maxRedemptions: "1",
  minSubtotalEur: "",
};

function formatCurrency(cents: number): string {
  return `EUR ${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString();
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [batchForm, setBatchForm] = useState({ ...emptyBatchForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBatch, setShowBatch] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<PromoCodeWithOrders | null>(null);

  const loadPromoCodes = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterActive !== null) params.set("isActive", filterActive.toString());

    const res = await fetch(`/api/admin/promo-codes?${params}`, { credentials: "include" });
    if (!res.ok) {
      setError("Failed to load promo codes.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPromoCodes(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadPromoCodes(), 300);
    return () => clearTimeout(timeout);
  }, [search, filterActive]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setSuccess(null);
    setGeneratedCodes(null);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingId(promoCode.id);
    setForm({
      code: promoCode.code,
      type: promoCode.type,
      value: promoCode.value.toString(),
      isActive: promoCode.isActive,
      startsAt: promoCode.startsAt ? new Date(promoCode.startsAt).toISOString().slice(0, 16) : "",
      endsAt: promoCode.endsAt ? new Date(promoCode.endsAt).toISOString().slice(0, 16) : "",
      maxRedemptions: promoCode.maxRedemptions?.toString() || "",
      minSubtotalEur: promoCode.minSubtotalEur ? (promoCode.minSubtotalEur / 100).toFixed(2) : "",
    });
    setShowBatch(false);
    setGeneratedCodes(null);
  };

  const viewPromoDetails = async (id: string) => {
    const res = await fetch(`/api/admin/promo-codes/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSelectedPromo(data.data);
    }
  };

  const submitForm = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.code.trim()) {
      setError("Code is required");
      return;
    }

    const value = parseFloat(form.value);
    if (form.type !== "FREE_SHIPPING" && (isNaN(value) || value < 0)) {
      setError("Value must be a positive number");
      return;
    }

    if (form.type === "PERCENT" && value > 100) {
      setError("Percentage cannot exceed 100");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === "FREE_SHIPPING" ? 0 : Math.round(value * (form.type === "AMOUNT" ? 100 : 1)),
      isActive: form.isActive,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
      maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
      minSubtotalEur: form.minSubtotalEur ? Math.round(parseFloat(form.minSubtotalEur) * 100) : undefined,
    };

    const res = await fetch(
      editingId ? `/api/admin/promo-codes/${editingId}` : "/api/admin/promo-codes",
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

    setSuccess(editingId ? "Promo code updated!" : "Promo code created!");
    resetForm();
    loadPromoCodes();
  };

  const submitBatch = async () => {
    setError(null);
    setSuccess(null);
    setGeneratedCodes(null);

    // Validation
    if (!batchForm.prefix.trim()) {
      setError("Prefix is required for batch generation");
      return;
    }

    const count = parseInt(batchForm.count);
    if (isNaN(count) || count < 1 || count > 1000) {
      setError("Count must be between 1 and 1000");
      return;
    }

    const value = parseFloat(batchForm.value);
    if (batchForm.type !== "FREE_SHIPPING" && (isNaN(value) || value < 0)) {
      setError("Value must be a positive number");
      return;
    }

    if (batchForm.type === "PERCENT" && value > 100) {
      setError("Percentage cannot exceed 100");
      return;
    }

    const payload = {
      batch: true,
      prefix: batchForm.prefix.trim().toUpperCase(),
      count,
      suffixLength: parseInt(batchForm.suffixLength) || 6,
      type: batchForm.type,
      value: batchForm.type === "FREE_SHIPPING" ? 0 : Math.round(value * (batchForm.type === "AMOUNT" ? 100 : 1)),
      isActive: batchForm.isActive,
      startsAt: batchForm.startsAt || undefined,
      endsAt: batchForm.endsAt || undefined,
      maxRedemptions: batchForm.maxRedemptions ? parseInt(batchForm.maxRedemptions) : undefined,
      minSubtotalEur: batchForm.minSubtotalEur ? Math.round(parseFloat(batchForm.minSubtotalEur) * 100) : undefined,
    };

    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Batch generation failed.");
      return;
    }

    const data = await res.json();
    setSuccess(`Generated ${data.data.created} promo codes!`);
    setGeneratedCodes(data.data.codes);
    setBatchForm({ ...emptyBatchForm });
    loadPromoCodes();
  };

  const deactivatePromoCode = async (id: string) => {
    if (!confirm("Deactivate this promo code?")) return;
    await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE", credentials: "include" });
    loadPromoCodes();
  };

  const exportToCSV = () => {
    if (promoCodes.length === 0) return;

    const headers = [
      "Code",
      "Type",
      "Value",
      "Status",
      "Times Redeemed",
      "Max Redemptions",
      "Min Subtotal (EUR)",
      "Starts At",
      "Ends At",
      "Created At",
    ];

    const rows = promoCodes.map((promo) => [
      promo.code,
      promo.type,
      promo.type === "PERCENT" ? `${promo.value}%` : promo.type === "AMOUNT" ? (promo.value / 100).toFixed(2) : "Free",
      promo.isActive ? "Active" : "Inactive",
      promo.timesRedeemed,
      promo.maxRedemptions ?? "Unlimited",
      promo.minSubtotalEur ? (promo.minSubtotalEur / 100).toFixed(2) : "None",
      promo.startsAt ? new Date(promo.startsAt).toISOString() : "",
      promo.endsAt ? new Date(promo.endsAt).toISOString() : "",
      new Date(promo.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape cells that contain commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `promo-codes-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formTitle = useMemo(
    () => (editingId ? "Edit Promo Code" : "Create Promo Code"),
    [editingId]
  );

  const getTypeLabel = (type: PromoType) => {
    switch (type) {
      case "PERCENT":
        return "%";
      case "AMOUNT":
        return "EUR";
      case "FREE_SHIPPING":
        return "Free Ship";
      default:
        return type;
    }
  };

  const getValueDisplay = (promo: PromoCode) => {
    switch (promo.type) {
      case "PERCENT":
        return `${promo.value}%`;
      case "AMOUNT":
        return formatCurrency(promo.value);
      case "FREE_SHIPPING":
        return "Free";
      default:
        return promo.value;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-5xl">Promo Codes</h1>
          <p className="text-slate-400">Create and manage discount codes for customers.</p>
        </div>
        <Link
          href="/admin"
          className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
        >
          Back to Admin
        </Link>
      </div>

      {/* Single Code Form */}
      <section className="border border-white/10 bg-slate-900/60 p-6">
        <h2 className="font-bebas text-2xl mb-4">{formTitle}</h2>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        {success && <p className="text-sm text-green-400 mb-3">{success}</p>}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. SUMMER25"
              disabled={!!editingId}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PromoType })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="AMOUNT">Fixed Amount (EUR)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Value {form.type === "PERCENT" ? "(%)" : form.type === "AMOUNT" ? "(EUR)" : ""}
            </label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "PERCENT" ? "20" : form.type === "AMOUNT" ? "10.00" : "N/A"}
              disabled={form.type === "FREE_SHIPPING"}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Start Date (Optional)</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">End Date (Optional)</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Max Uses (Optional)</label>
            <input
              type="number"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              placeholder="Unlimited"
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Min Order EUR (Optional)</label>
            <input
              type="number"
              step="0.01"
              value={form.minSubtotalEur}
              onChange={(e) => setForm({ ...form, minSubtotalEur: e.target.value })}
              placeholder="No minimum"
              className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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
            {editingId ? "Save Changes" : "Create Promo Code"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              setShowBatch(!showBatch);
              resetForm();
            }}
            className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
          >
            {showBatch ? "Hide Batch" : "Batch Generate"}
          </button>
        </div>
      </section>

      {/* Batch Generation Form */}
      {showBatch && (
        <section className="border border-gold/30 bg-slate-900/60 p-6">
          <h2 className="font-bebas text-2xl mb-4 text-gold">Batch Generate Codes</h2>
          <p className="text-sm text-slate-400 mb-4">
            Create multiple unique promo codes at once. Each code will have a random suffix.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Prefix</label>
              <input
                value={batchForm.prefix}
                onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                placeholder="e.g. SUMMER25-"
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Count</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={batchForm.count}
                onChange={(e) => setBatchForm({ ...batchForm, count: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Suffix Length</label>
              <input
                type="number"
                min="4"
                max="12"
                value={batchForm.suffixLength}
                onChange={(e) => setBatchForm({ ...batchForm, suffixLength: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
              <select
                value={batchForm.type}
                onChange={(e) => setBatchForm({ ...batchForm, type: e.target.value as PromoType })}
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="AMOUNT">Fixed Amount (EUR)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Value</label>
              <input
                type="number"
                value={batchForm.value}
                onChange={(e) => setBatchForm({ ...batchForm, value: e.target.value })}
                placeholder={batchForm.type === "PERCENT" ? "20" : batchForm.type === "AMOUNT" ? "10.00" : "N/A"}
                disabled={batchForm.type === "FREE_SHIPPING"}
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Max Uses Per Code</label>
              <input
                type="number"
                min="1"
                value={batchForm.maxRedemptions}
                onChange={(e) => setBatchForm({ ...batchForm, maxRedemptions: e.target.value })}
                placeholder="Unlimited"
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
              <p className="text-xs text-slate-500">Set to 1 for single-use codes</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">End Date (Optional)</label>
              <input
                type="datetime-local"
                value={batchForm.endsAt}
                onChange={(e) => setBatchForm({ ...batchForm, endsAt: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={batchForm.isActive}
                onChange={(e) => setBatchForm({ ...batchForm, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-300">Active</span>
            </div>
          </div>

          {generatedCodes && generatedCodes.length > 0 && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded">
              <p className="text-sm text-green-400 font-medium mb-2">
                Generated {generatedCodes.length} codes:
              </p>
              <div className="max-h-40 overflow-y-auto">
                <code className="text-xs text-green-300 block whitespace-pre-wrap">
                  {generatedCodes.join("\n")}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCodes.join("\n"));
                }}
                className="mt-2 text-xs uppercase tracking-[0.2em] text-green-400 hover:text-green-300"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={submitBatch}
              className="px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              Generate Batch
            </button>
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <section className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code..."
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            disabled={promoCodes.length === 0}
            className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${
              filterActive === null ? "border-gold text-gold" : "border-white/10 text-slate-400"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${
              filterActive === true ? "border-gold text-gold" : "border-white/10 text-slate-400"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${
              filterActive === false ? "border-gold text-gold" : "border-white/10 text-slate-400"
            }`}
          >
            Inactive
          </button>
        </div>
      </section>

      {/* Promo Codes List */}
      <section className="space-y-4">
        <h2 className="font-bebas text-2xl">Existing Promo Codes</h2>
        {loading ? (
          <p className="text-slate-400">Loading promo codes...</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-slate-400">No promo codes found.</p>
        ) : (
          <div className="space-y-4">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className="border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bebas text-xl">{promo.code}</h3>
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wider ${
                        promo.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      <span className="text-slate-500">Type:</span> {getTypeLabel(promo.type)} {getValueDisplay(promo)}
                    </span>
                    <span>
                      <span className="text-slate-500">Used:</span>{" "}
                      {promo.timesRedeemed}
                      {promo.maxRedemptions !== null ? ` / ${promo.maxRedemptions}` : " times"}
                    </span>
                    {promo.minSubtotalEur !== null && (
                      <span>
                        <span className="text-slate-500">Min Order:</span> {formatCurrency(promo.minSubtotalEur)}
                      </span>
                    )}
                    {promo.startsAt && (
                      <span>
                        <span className="text-slate-500">From:</span> {formatDate(promo.startsAt)}
                      </span>
                    )}
                    {promo.endsAt && (
                      <span>
                        <span className="text-slate-500">Until:</span> {formatDate(promo.endsAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => viewPromoDetails(promo.id)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(promo)}
                    className="px-4 py-2 border border-white/10 text-xs uppercase tracking-[0.2em] hover:border-gold"
                  >
                    Edit
                  </button>
                  {promo.isActive && (
                    <button
                      onClick={() => deactivatePromoCode(promo.id)}
                      className="px-4 py-2 border border-red-500/40 text-xs uppercase tracking-[0.2em] text-red-300 hover:border-red-400"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promo Code Details Modal */}
      {selectedPromo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPromo(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bebas text-3xl">{selectedPromo.code}</h3>
              <button
                onClick={() => setSelectedPromo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <span className="text-slate-500">Type:</span>{" "}
                {getValueDisplay(selectedPromo)}
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <span className={selectedPromo.isActive ? "text-green-400" : "text-red-400"}>
                  {selectedPromo.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Times Redeemed:</span>{" "}
                {selectedPromo.timesRedeemed}
                {selectedPromo.maxRedemptions !== null ? ` / ${selectedPromo.maxRedemptions}` : ""}
              </div>
              {selectedPromo.minSubtotalEur !== null && (
                <div>
                  <span className="text-slate-500">Min Order:</span>{" "}
                  {formatCurrency(selectedPromo.minSubtotalEur)}
                </div>
              )}
              {selectedPromo.startsAt && (
                <div>
                  <span className="text-slate-500">Starts:</span>{" "}
                  {formatDate(selectedPromo.startsAt)}
                </div>
              )}
              {selectedPromo.endsAt && (
                <div>
                  <span className="text-slate-500">Ends:</span>{" "}
                  {formatDate(selectedPromo.endsAt)}
                </div>
              )}
            </div>

            <h4 className="font-bebas text-xl mb-4">Orders Using This Code</h4>
            {selectedPromo.orders && selectedPromo.orders.length > 0 ? (
              <div className="space-y-2">
                {selectedPromo.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-white/10 p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-sm">{order.orderNumber}</span>
                      <p className="text-xs text-slate-500">{order.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatCurrency(order.totalEur)}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No orders have used this code yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
