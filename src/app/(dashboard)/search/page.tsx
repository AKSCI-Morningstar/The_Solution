"use client";

import { Suspense } from "react";
import { SearchExperience } from "@/features/search";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
        <p className="text-muted-foreground text-sm">
          Find entities, documents, organizations, and people across the active workspace.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SearchExperience />
      </Suspense>
    </div>
  );
}
