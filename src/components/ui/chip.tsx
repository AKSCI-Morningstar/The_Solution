"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "md";
  onRemove?: () => void;
}

const variantStyles = {
  default: "bg-foreground text-background",
  secondary: "bg-muted text-muted-foreground hover:bg-surface-hover",
  outline: "border border-border text-foreground hover:bg-surface-hover",
};

const sizeStyles = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-8 px-3 text-xs",
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className = "", variant = "secondary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-visible:ring-ring inline-flex items-center gap-1 rounded-full font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Chip.displayName = "Chip";
