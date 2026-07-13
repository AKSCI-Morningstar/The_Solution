"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning";
}

const variantStyles = {
  default: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, max = 100, variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";
