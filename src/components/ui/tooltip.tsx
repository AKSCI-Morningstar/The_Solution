"use client";

import { type ReactNode, forwardRef, useState, useRef } from "react";
import { cn } from "@/shared/utils";

export interface TooltipProps {
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  children?: ReactNode;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ className = "", content, side = "top", delay = 300, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const show = () => {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    };
    const hide = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(false);
    };

    const sideStyles: Record<string, string> = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
      left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
      right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        {...props}
      >
        {children}
        {isVisible && (
          <div
            role="tooltip"
            className={cn(
              "animate-fade-in bg-foreground text-background absolute z-50 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm",
              sideStyles[side],
            )}
          >
            {content}
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";
