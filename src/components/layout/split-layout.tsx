import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface SplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: "1:1" | "1:2" | "2:1" | "3:1" | "1:3";
  sidebar?: React.ReactNode;
  sidebarLabel?: string;
  sidebarWidth?: string;
}

const ratioStyles: Record<NonNullable<SplitLayoutProps["ratio"]>, string> = {
  "1:1": "lg:grid-cols-[1fr_1fr]",
  "1:2": "lg:grid-cols-[1fr_2fr]",
  "2:1": "lg:grid-cols-[2fr_1fr]",
  "3:1": "lg:grid-cols-[3fr_1fr]",
  "1:3": "lg:grid-cols-[1fr_3fr]",
};

export const SplitLayout = forwardRef<HTMLDivElement, SplitLayoutProps>(
  (
    { className = "", ratio = "2:1", sidebar, sidebarLabel = "Sidebar", children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-1 gap-6", ratioStyles[ratio], className)}
        {...props}
      >
        <div className="min-w-0">{children}</div>
        {sidebar && (
          <aside aria-label={sidebarLabel} className="min-w-0">
            {sidebar}
          </aside>
        )}
      </div>
    );
  },
);

SplitLayout.displayName = "SplitLayout";
