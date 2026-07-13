"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/80 dark:bg-white dark:text-black dark:hover:bg-white/80",
  secondary: "border border-border bg-background hover:bg-surface-hover",
  ghost: "hover:bg-surface-hover",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-visible:ring-ring inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
