"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  fallback?: string;
}

const sizeStyles = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", src, alt = "", initials, size = "md", ...props }, ref) => {
    if (src) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full",
            sizeStyles[size],
            className,
          )}
          {...props}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="size-full object-cover" />
        </div>
      );
    }
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted text-muted-foreground relative flex shrink-0 items-center justify-center rounded-full font-medium",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {initials ?? "?"}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";
