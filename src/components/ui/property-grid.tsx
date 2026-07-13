"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface PropertyGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
}

const gridColumns = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export const PropertyGrid = forwardRef<HTMLDivElement, PropertyGridProps>(
  ({ className = "", columns = 2, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("grid gap-4", gridColumns[columns], className)} {...props}>
        {children}
      </div>
    );
  },
);

PropertyGrid.displayName = "PropertyGrid";
