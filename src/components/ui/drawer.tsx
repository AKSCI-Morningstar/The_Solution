"use client";

import { type HTMLAttributes, forwardRef, useEffect } from "react";
import { cn } from "@/shared/utils";
import { X } from "lucide-react";

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
}

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({ className = "", isOpen, onClose, title, side = "right", children, ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "border-border bg-background animate-fade-in fixed top-0 bottom-0 z-50 flex w-full max-w-md flex-col shadow-xl",
            side === "right" ? "right-0 border-l" : "left-0 border-r",
            className,
          )}
          {...props}
        >
          <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
            <h2 className="text-foreground text-sm font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md p-1 transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    );
  },
);

Drawer.displayName = "Drawer";
