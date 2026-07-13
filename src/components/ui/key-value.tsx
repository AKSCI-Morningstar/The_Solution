"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface KeyValueProps extends HTMLAttributes<HTMLDListElement> {
  pairs: ReadonlyArray<{ key: string; value: React.ReactNode }>;
  direction?: "row" | "column";
}

export const KeyValue = forwardRef<HTMLDListElement, KeyValueProps>(
  ({ className = "", pairs, direction = "column", ...props }, ref) => {
    return (
      <dl
        ref={ref}
        className={cn(
          direction === "row" ? "flex flex-wrap gap-x-6 gap-y-2" : "flex flex-col gap-2",
          className,
        )}
        {...props}
      >
        {pairs.map((pair) => (
          <div
            key={pair.key}
            className={cn(
              "flex",
              direction === "row" ? "items-center gap-1.5" : "flex-col gap-0.5",
            )}
          >
            <dt className="text-muted-foreground text-xs font-medium">{pair.key}</dt>
            <dd className="text-foreground text-sm">{pair.value}</dd>
          </div>
        ))}
      </dl>
    );
  },
);

KeyValue.displayName = "KeyValue";
