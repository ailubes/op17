"use client";

import { useState } from "react";

type PromoValidation = {
  valid: boolean;
  code?: string;
  discountEur?: number;
  message?: string;
  error?: string;
};

type PromoCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  validation: PromoValidation | null;
  onValidate: () => void;
  onRemove: () => void;
  loading: boolean;
  t: {
    promoCode: string;
    promoCodePlaceholder: string;
    applyCode: string;
    removeCode: string;
    promoApplied: string;
    discount: string;
    errors: Record<string, string>;
  };
};

export function PromoCodeInput({
  value,
  onChange,
  validation,
  onValidate,
  onRemove,
  loading,
  t,
}: PromoCodeInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasValidCode = validation?.valid === true;
  const hasError = validation?.valid === false;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && !loading && !hasValidCode) {
      e.preventDefault();
      onValidate();
    }
  };

  return (
    <div className="space-y-3">
      {!hasValidCode ? (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t.promoCode}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t.promoCodePlaceholder}
                disabled={loading}
                className={`w-full bg-slate-950 border px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none transition-colors uppercase ${
                  hasError
                    ? "border-red-500/50 focus:border-red-400"
                    : isFocused
                      ? "border-gold"
                      : "border-white/10"
                }`}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={onValidate}
              disabled={!value.trim() || loading}
              className="px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.applyCode}
            </button>
          </div>

          {hasError && (
            <p className="text-sm text-red-400">
              {t.errors[validation.error || "INVALID_CODE"] ||
                validation.message ||
                t.errors.INVALID_CODE}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t.promoCode}
            </span>
            <button
              onClick={onRemove}
              className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-red-400 transition-colors"
            >
              {t.removeCode}
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30">
            <span className="text-green-400 font-mono">{validation.code}</span>
            <span className="text-green-400/80 text-sm">{validation.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
