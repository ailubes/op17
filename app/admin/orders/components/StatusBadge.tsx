"use client";

import { OrderStatus } from "../types";
import { getStatusColor, getStatusLabel } from "../utils";

interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function StatusBadge({
  status,
  size = "md",
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const hasDot = showDot && colors.dot;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
          aria-hidden="true"
        />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
