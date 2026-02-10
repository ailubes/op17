"use client";

import { FilterOption } from "../types";

interface FilterChipsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function FilterChips({
  options,
  selected,
  onSelect,
  className = "",
}: FilterChipsProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`}
      role="tablist"
      aria-label="Filter orders"
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            role="tab"
            aria-selected={isSelected}
            className={`
              flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full
              text-sm font-medium transition-all duration-200
              min-h-[44px] touch-manipulation
              ${
                isSelected
                  ? "bg-gold text-slate-950 shadow-lg shadow-gold/20"
                  : "bg-slate-800/50 text-slate-400 border border-white/10 hover:border-gold/50 hover:text-slate-200"
              }
            `}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-xs
                  ${
                    isSelected
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-slate-700 text-slate-400"
                  }
                `}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
