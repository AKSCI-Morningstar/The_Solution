"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status: "active" | "inactive" | "pending" | "error" | "success" | "warning";
  label?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const dotStyles = {
  active: "bg-success",
  inactive: "bg-muted-foreground/40",
  pending: "bg-warning",
  error: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
};

const sizeStyles = {
  sm: "size-1.5",
  md: "size-2",
};

export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ className = "", status, label, size = "md", showLabel = true, ...props }, ref) => {
    return (
      <span ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props}>
        <span className={cn("rounded-full", dotStyles[status], sizeStyles[size])} />
        {(showLabel || label) && (
          <span className="text-muted-foreground text-sm">{label ?? status}</span>
        )}
      </span>
    );
  },
);

StatusIndicator.displayName = "StatusIndicator";
