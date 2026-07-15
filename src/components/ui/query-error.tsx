"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils";

export interface QueryErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryError({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center",
        className,
      )}
    >
      <AlertCircle className="text-destructive mb-4 size-10" aria-hidden="true" />
      <h3 className="text-foreground mb-1 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
