import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

const gapStyles: Record<NonNullable<StackProps["gap"]>, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

const alignStyles: Record<NonNullable<StackProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<NonNullable<StackProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className = "", direction = "column", gap = 4, align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          direction === "row" ? "flex-row" : "flex-col",
          gapStyles[gap],
          align && alignStyles[align],
          justify && justifyStyles[justify],
          className,
        )}
        {...props}
      />
    );
  },
);

Stack.displayName = "Stack";
