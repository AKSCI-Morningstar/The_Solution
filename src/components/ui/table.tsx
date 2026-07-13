"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export type TableProps = HTMLAttributes<HTMLTableElement>;

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    );
  },
);

Table.displayName = "Table";

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = "", ...props }, ref) => {
    return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />;
  },
);

TableHeader.displayName = "TableHeader";

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = "", ...props }, ref) => {
    return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
  },
);

TableBody.displayName = "TableBody";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-border hover:bg-surface-hover data-[state=selected]:bg-muted border-b transition-colors",
          className,
        )}
        {...props}
      />
    );
  },
);

TableRow.displayName = "TableRow";

export type TableHeadProps = HTMLAttributes<HTMLTableCellElement>;

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "text-muted-foreground h-10 px-4 text-left align-middle text-xs font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);

TableHead.displayName = "TableHead";

export type TableCellProps = HTMLAttributes<HTMLTableCellElement>;

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = "", ...props }, ref) => {
    return <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />;
  },
);

TableCell.displayName = "TableCell";
