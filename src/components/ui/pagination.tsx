"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <PaginationButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </PaginationButton>
      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="text-muted-foreground flex h-8 w-8 items-center justify-center text-sm"
          >
            ...
          </span>
        ) : (
          <PaginationButton
            key={page}
            onClick={() => onPageChange(page as number)}
            isActive={currentPage === page}
          >
            {page}
          </PaginationButton>
        ),
      )}
      <PaginationButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </PaginationButton>
    </nav>
  );
}

Pagination.displayName = "Pagination";

interface PaginationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

const PaginationButton = forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className = "", isActive, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          isActive ? "bg-foreground text-background" : "text-foreground hover:bg-surface-hover",
          className,
        )}
        {...props}
      />
    );
  },
);

PaginationButton.displayName = "PaginationButton";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
