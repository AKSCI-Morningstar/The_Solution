import { ReportExplorer } from "@/features/reporting/components";

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Enterprise Reporting</h1>
        <p className="text-muted-foreground text-sm">
          Deterministic reports and analytics generated entirely from data already in this platform.
        </p>
      </div>
      <ReportExplorer />
    </div>
  );
}
