import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-background",
  bordered: "border border-border bg-background rounded-lg",
  muted: "bg-muted rounded-lg",
};

const paddingStyles = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className = "", variant = "bordered", padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(variantStyles[variant], paddingStyles[padding], className)}
        {...props}
      />
    );
  },
);

Panel.displayName = "Panel";
