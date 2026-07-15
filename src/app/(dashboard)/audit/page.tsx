"use client";

import { AuditLogViewer } from "@/features/audit";

export default function AuditLogPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Browse immutable organization activity with filtering, pagination, and CSV export.
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
