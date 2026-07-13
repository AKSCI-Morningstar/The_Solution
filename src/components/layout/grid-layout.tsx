import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | "auto";
  gap?: 3 | 4 | 6 | 8;
}

const gridCols: Record<NonNullable<GridLayoutProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  auto: "grid-cols-[repeat(auto-fill,minmax(250px,1fr))]",
};

const gapStyles: Record<NonNullable<GridLayoutProps["gap"]>, string> = {
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

export const GridLayout = forwardRef<HTMLDivElement, GridLayoutProps>(
  ({ className = "", columns = 1, gap = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid", gridCols[columns], gapStyles[gap], className)}
        {...props}
      />
    );
  },
);

GridLayout.displayName = "GridLayout";
