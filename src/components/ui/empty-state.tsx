"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className = "", icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-16 text-center",
          className,
        )}
        {...props}
      >
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div>
          <p className="text-foreground text-sm font-medium">{title}</p>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";
