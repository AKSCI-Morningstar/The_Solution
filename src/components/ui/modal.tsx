"use client";

import { type HTMLAttributes, forwardRef, useEffect } from "react";
import { cn } from "@/shared/utils";
import { X } from "lucide-react";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    { className = "", isOpen, onClose, title, description, size = "md", children, ...props },
    ref,
  ) => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "border-border bg-background animate-fade-in relative z-50 w-full rounded-lg border p-6 shadow-xl",
            sizeStyles[size],
            className,
          )}
          {...props}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              {title && <h2 className="text-foreground text-lg font-semibold">{title}</h2>}
              {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-md p-1 transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  },
);

Modal.displayName = "Modal";
