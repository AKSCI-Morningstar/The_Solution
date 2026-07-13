import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Failed to load engineering data",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <AlertCircle className="text-destructive mb-4 size-12" />
      <h3 className="text-foreground mb-1 text-lg font-medium">Something went wrong</h3>
      <p className="text-muted-foreground mb-6 text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
