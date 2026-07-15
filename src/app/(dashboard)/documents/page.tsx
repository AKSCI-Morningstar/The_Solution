"use client";

import { Suspense } from "react";
import { DocumentWorkspace } from "@/features/documents";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Document Workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse uploaded engineering documents, versions, and ingestion status.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <DocumentWorkspace />
      </Suspense>
    </div>
  );
}
