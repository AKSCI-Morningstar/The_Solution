"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
}

const variantStyles = {
  info: "border-accent/20 bg-accent/5 text-foreground",
  success: "border-success/20 bg-success/5 text-foreground",
  warning: "border-warning/20 bg-warning/5 text-foreground",
  error: "border-destructive/20 bg-destructive/5 text-foreground",
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "info", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn("rounded-lg border p-4 text-sm", variantStyles[variant], className)}
        {...props}
      />
    );
  },
);

Alert.displayName = "Alert";

export type AlertTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <h5 ref={ref} className={cn("text-foreground mb-1 font-medium", className)} {...props} />
    );
  },
);

AlertTitle.displayName = "AlertTitle";

export type AlertDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = "", ...props }, ref) => {
    return <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />;
  },
);

AlertDescription.displayName = "AlertDescription";
