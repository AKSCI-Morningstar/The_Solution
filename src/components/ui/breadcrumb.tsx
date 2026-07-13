"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className = "", items, separator, ...props }, ref) => {
    if (items.length === 0) return null;
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center gap-1 text-sm", className)}
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={item.label} className="flex items-center gap-1">
              {index > 0 &&
                (separator ?? <ChevronRight className="text-muted-foreground size-3.5" />)}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    );
  },
);

Breadcrumb.displayName = "Breadcrumb";
