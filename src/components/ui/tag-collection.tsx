"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface TagCollectionProps extends HTMLAttributes<HTMLDivElement> {
  tags: ReadonlyArray<{ id: string; label: string; color?: string }>;
  onRemove?: (id: string) => void;
}

export const TagCollection = forwardRef<HTMLDivElement, TagCollectionProps>(
  ({ className = "", tags, onRemove, ...props }, ref) => {
    if (tags.length === 0) return null;
    return (
      <div ref={ref} className={cn("flex flex-wrap gap-1.5", className)} {...props}>
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          >
            {tag.label}
            {onRemove && (
              <button
                onClick={() => onRemove(tag.id)}
                className="text-muted-foreground hover:text-foreground ml-0.5"
                aria-label={`Remove ${tag.label}`}
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
    );
  },
);

TagCollection.displayName = "TagCollection";
