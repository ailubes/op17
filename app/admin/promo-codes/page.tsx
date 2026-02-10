"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PromoCode, PromoType } from "@prisma/client";
import {
  EntityCard,
  EntityList,
  ActionButton,
  MobileBottomSheet,
  FilterBar,
  toastSuccess,
  toastError,
} from "@/components/admin";

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
  return new Date(date).toLocaleDateString();
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<PromoCodeWithOrders | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPromoCodes = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
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
  }, [debouncedSearch, filterActive]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setSuccess(null);
    setGeneratedCodes(null);
    setIsFormOpen(false);
  };

  const resetBatchForm = () => {
    setBatchForm({ ...emptyBatchForm });
    setGeneratedCodes(null);
    setIsBatchOpen(false);
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
    setIsFormOpen(true);
  };

  const viewPromoDetails = async (id: string) => {
    const res = await fetch(`/api/admin/promo-codes/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSelectedPromo(data.data);
      setIsDetailOpen(true);
    }
  };

  const submitForm = async () => {
    setError(null);
    setSuccess(null);

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

    const headers = ["Code", "Type", "Value", "Status", "Times Redeemed", "Max Redemptions", "Min Subtotal (EUR)", "Starts At", "Ends At", "Created At"];
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

    const csvContent = [headers.join(","), ...rows.map((row) =>
      row.map((cell) => {
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    )].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `promo-codes-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeLabel = (type: PromoType) => {
    switch (type) {
      case "PERCENT": return "%";
      case "AMOUNT": return "EUR";
      case "FREE_SHIPPING": return "Free Ship";
      default: return type;
    }
  };

  const getValueDisplay = (promo: PromoCode) => {
    switch (promo.type) {
      case "PERCENT": return `${promo.value}%`;
      case "AMOUNT": return formatCurrency(promo.value);
      case "FREE_SHIPPING": return "Free";
      default: return promo.value;
    }
  };

  const formTitle = useMemo(() => (editingId ? "Edit Promo Code" : "Create Promo Code"), [editingId]);

  const singleFormContent = (
    <div className="p-4 space-y-4">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-sm text-red-400">{error}</p></div>}
      {success && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-sm text-green-400">{success}</p></div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. SUMMER25"
            disabled={!!editingId}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px] disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as PromoType })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
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
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Start Date</label>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">End Date</label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Max Uses</label>
          <input
            type="number"
            value={form.maxRedemptions}
            onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            placeholder="Unlimited"
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Min Order EUR</label>
          <input
            type="number"
            step="0.01"
            value={form.minSubtotalEur}
            onChange={(e) => setForm({ ...form, minSubtotalEur: e.target.value })}
            placeholder="No minimum"
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
          {editingId ? "Save Changes" : "Create Promo Code"}
        </ActionButton>
        {editingId && (
          <ActionButton variant="ghost" onClick={resetForm}>Cancel</ActionButton>
        )}
      </div>

      {!editingId && (
        <button
          onClick={() => { resetForm(); setIsBatchOpen(true); }}
          className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors w-full text-center pt-2"
        >
          Switch to Batch Generate
        </button>
      )}
    </div>
  );

  const batchFormContent = (
    <div className="p-4 space-y-4">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-sm text-red-400">{error}</p></div>}
      {success && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-sm text-green-400">{success}</p></div>}

      <p className="text-sm text-slate-400">Create multiple unique promo codes with a random suffix.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Prefix</label>
          <input
            value={batchForm.prefix}
            onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
            placeholder="e.g. SUMMER25-"
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
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
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
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
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</label>
          <select
            value={batchForm.type}
            onChange={(e) => setBatchForm({ ...batchForm, type: e.target.value as PromoType })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
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
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Max Uses Per Code</label>
          <input
            type="number"
            min="1"
            value={batchForm.maxRedemptions}
            onChange={(e) => setBatchForm({ ...batchForm, maxRedemptions: e.target.value })}
            placeholder="Unlimited"
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-gold min-h-[48px]"
          />
          <p className="text-xs text-slate-500">Set to 1 for single-use codes</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">End Date</label>
          <input
            type="datetime-local"
            value={batchForm.endsAt}
            onChange={(e) => setBatchForm({ ...batchForm, endsAt: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[48px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={batchForm.isActive}
          onChange={(e) => setBatchForm({ ...batchForm, isActive: e.target.checked })}
          className="h-5 w-5 rounded border-white/10 bg-slate-950 text-gold focus:ring-gold"
        />
        <span className="text-sm text-slate-300">Active</span>
      </div>

      {generatedCodes && generatedCodes.length > 0 && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 font-medium mb-2">Generated {generatedCodes.length} codes:</p>
          <div className="max-h-40 overflow-y-auto">
            <code className="text-xs text-green-300 block whitespace-pre-wrap">{generatedCodes.join("\n")}</code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(generatedCodes.join("\n"))}
            className="mt-2 text-xs uppercase tracking-[0.2em] text-green-400 hover:text-green-300"
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" onClick={submitBatch} fullWidth>Generate Batch</ActionButton>
      </div>

      <button
        onClick={() => { resetBatchForm(); setIsFormOpen(true); }}
        className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors w-full text-center pt-2"
      >
        Switch to Single Code
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl sm:text-5xl">Promo Codes</h1>
          <p className="text-slate-400 text-sm sm:text-base">Create and manage discount codes for customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton
            variant="primary"
            onClick={() => setIsFormOpen(true)}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          >
            New Code
          </ActionButton>
          <Link href="/admin" className="text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors">Back</Link>
        </div>
      </div>

      {/* Desktop Forms */}
      <section className="hidden lg:block border border-white/10 bg-slate-900/60 rounded-lg p-6">
        <h2 className="font-bebas text-2xl mb-4">{showBatch ? "Batch Generate Codes" : formTitle}</h2>
        {showBatch ? batchFormContent : singleFormContent}
        {!editingId && (
          <button
            onClick={() => setShowBatch(!showBatch)}
            className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors"
          >
            {showBatch ? "← Back to single code" : "Batch generate multiple codes →"}
          </button>
        )}
      </section>

      {/* Mobile Bottom Sheets */}
      <MobileBottomSheet isOpen={isFormOpen} onClose={resetForm} title={formTitle}>
        {singleFormContent}
      </MobileBottomSheet>

      <MobileBottomSheet isOpen={isBatchOpen} onClose={resetBatchForm} title="Batch Generate Codes">
        {batchFormContent}
      </MobileBottomSheet>

      {/* Promo Detail Bottom Sheet */}
      <MobileBottomSheet isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedPromo?.code || "Promo Code Details"}>
        {selectedPromo && (
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Type:</span> {getValueDisplay(selectedPromo)}</div>
              <div><span className="text-slate-500">Status:</span> <span className={selectedPromo.isActive ? "text-green-400" : "text-red-400"}>{selectedPromo.isActive ? "Active" : "Inactive"}</span></div>
              <div><span className="text-slate-500">Used:</span> {selectedPromo.timesRedeemed}{selectedPromo.maxRedemptions !== null ? ` / ${selectedPromo.maxRedemptions}` : ""}</div>
              {selectedPromo.minSubtotalEur !== null && (
                <div><span className="text-slate-500">Min Order:</span> {formatCurrency(selectedPromo.minSubtotalEur)}</div>
              )}
              {selectedPromo.startsAt && <div><span className="text-slate-500">Starts:</span> {formatDate(selectedPromo.startsAt)}</div>}
              {selectedPromo.endsAt && <div><span className="text-slate-500">Ends:</span> {formatDate(selectedPromo.endsAt)}</div>}
            </div>

            <div>
              <h4 className="font-bebas text-xl mb-3">Orders Using This Code</h4>
              {selectedPromo.orders && selectedPromo.orders.length > 0 ? (
                <div className="space-y-2">
                  {selectedPromo.orders.map((order) => (
                    <div key={order.id} className="border border-white/10 p-3 rounded-lg flex items-center justify-between">
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
                <p className="text-slate-400 text-sm">No orders have used this code yet.</p>
              )}
            </div>
          </div>
        )}
      </MobileBottomSheet>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code..."
        filters={[
          {
            value: filterActive === null ? "all" : filterActive ? "active" : "inactive",
            options: [
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
            onChange: (val) => setFilterActive(val === "all" ? null : val === "active"),
          },
        ]}
        actions={
          <ActionButton variant="outline" size="sm" onClick={exportToCSV} disabled={promoCodes.length === 0}>
            Export CSV
          </ActionButton>
        }
      />

      {/* Promo Codes List */}
      <EntityList
        title="Existing Promo Codes"
        count={promoCodes.length}
        loading={loading}
        emptyMessage="No promo codes found."
      >
        {promoCodes.map((promo) => (
          <EntityCard
            key={promo.id}
            title={promo.code}
            badges={[{ variant: promo.isActive ? "success" : "error", label: promo.isActive ? "Active" : "Inactive" }]}
            meta={[
              { label: "Type", value: `${getTypeLabel(promo.type)} ${getValueDisplay(promo)}` },
              { label: "Used", value: `${promo.timesRedeemed}${promo.maxRedemptions !== null ? ` / ${promo.maxRedemptions}` : " times"}` },
              ...(promo.minSubtotalEur !== null ? [{ label: "Min Order", value: formatCurrency(promo.minSubtotalEur) }] : []),
              ...(promo.endsAt ? [{ label: "Until", value: formatDate(promo.endsAt) }] : []),
            ]}
            actions={
              <>
                <ActionButton variant="outline" size="sm" onClick={() => viewPromoDetails(promo.id)}>View</ActionButton>
                <ActionButton variant="outline" size="sm" onClick={() => handleEdit(promo)}>Edit</ActionButton>
                {promo.isActive && (
                  <ActionButton variant="danger" size="sm" onClick={() => deactivatePromoCode(promo.id)}>Deactivate</ActionButton>
                )}
              </>
            }
          />
        ))}
      </EntityList>
    </div>
  );
}
