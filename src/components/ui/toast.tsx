"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  onDismiss?: () => void;
}

const variantStyles = {
  info: "border-border bg-background",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  error: "border-destructive/30 bg-destructive/5",
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className = "", variant = "info", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "animate-slide-up flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Toast.displayName = "Toast";
