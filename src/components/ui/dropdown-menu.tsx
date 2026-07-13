"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
  useRef,
  useEffect,
} from "react";
import { cn } from "@/shared/utils";

export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  trigger: ReactNode;
  align?: "start" | "end";
}

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className = "", trigger, align = "start", children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    return (
      <div ref={ref} className={cn("relative inline-block", className)} {...props}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {trigger}
        </div>
        {isOpen && (
          <div
            className={cn(
              "border-border bg-background animate-fade-in absolute z-50 mt-1 min-w-[180px] rounded-lg border p-1 shadow-lg",
              align === "end" ? "right-0" : "left-0",
            )}
            role="menu"
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);

DropdownMenu.displayName = "DropdownMenu";

export interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className = "", inset, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="menuitem"
        className={cn(
          "text-foreground hover:bg-surface-hover focus-visible:bg-surface-hover flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          inset && "pl-8",
          className,
        )}
        {...props}
      />
    );
  },
);

DropdownMenuItem.displayName = "DropdownMenuItem";

export type DropdownMenuSeparatorProps = HTMLAttributes<HTMLDivElement>;

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className = "", ...props }, ref) => {
    return <div ref={ref} className={cn("bg-border my-1 h-px", className)} {...props} />;
  },
);

DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export type DropdownMenuLabelProps = HTMLAttributes<HTMLDivElement>;

export const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-muted-foreground px-2.5 py-1.5 text-xs font-medium", className)}
        {...props}
      />
    );
  },
);

DropdownMenuLabel.displayName = "DropdownMenuLabel";
