"use client";

import { ReactNode } from "react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  actions?: ReactNode;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
}: FilterBarProps) {
  const hasFilters = filters && filters.length > 0;
  const hasActiveFilters = hasFilters && filters.some(f => f.value !== "all" && f.value !== "");

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 pl-12 pr-10 py-3.5 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all min-h-[48px]"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {filter.options.map((option) => {
                const isSelected = filter.value === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => filter.onChange(option.value)}
                    className={`
                      flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full
                      text-sm font-medium transition-all duration-200
                      min-h-[44px] touch-manipulation
                      ${isSelected
                        ? "bg-gold text-slate-950 shadow-lg shadow-gold/20"
                        : "bg-slate-800/50 text-slate-400 border border-white/10 hover:border-gold/50 hover:text-slate-200"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-700 text-slate-400"}`}>
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => filters.forEach(f => f.onChange("all"))}
              className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-gold transition-colors px-2"
            >
              Clear all
            </button>
          )}
          {actions && <div className="ml-auto flex-shrink-0">{actions}</div>}
        </div>
      )}
    </div>
  );
}
