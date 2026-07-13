"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-muted-foreground animate-spin rounded-full border-current border-t-transparent",
          sizeStyles[size],
          className,
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading</span>
      </div>
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";
