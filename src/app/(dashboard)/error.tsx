"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/ui/query-error";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error-boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <QueryError
        title="Workspace error"
        message={error.message || "An unexpected error occurred while rendering this page."}
        onRetry={reset}
      />
      <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
        Return to dashboard
      </Button>
    </div>
  );
}
