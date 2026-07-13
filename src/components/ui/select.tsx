"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, id, options, placeholder, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-foreground text-sm font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "border-border bg-background focus:border-ring focus:ring-ring h-10 rounded-md border px-3 text-sm transition-colors outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
