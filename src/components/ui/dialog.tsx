"use client";

import { type HTMLAttributes, type ReactNode, forwardRef, useEffect } from "react";
import { cn } from "@/shared/utils";
export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className = "", open, onOpenChange, children, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      if (open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "border-border bg-background animate-fade-in relative z-50 w-full max-w-md rounded-lg border p-6 shadow-xl",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

Dialog.displayName = "Dialog";

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("mb-4 flex items-start justify-between", className)} {...props}>
        {children}
      </div>
    );
  },
);

DialogHeader.displayName = "DialogHeader";

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h2 ref={ref} className={cn("text-foreground text-lg font-semibold", className)} {...props}>
        {children}
      </h2>
    );
  },
);

DialogTitle.displayName = "DialogTitle";

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
        {children}
      </div>
    );
  },
);

DialogContent.displayName = "DialogContent";
