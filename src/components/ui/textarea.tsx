"use client";

import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-foreground text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "border-border bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring min-h-[80px] rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            className,
          )}
          {...props}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
