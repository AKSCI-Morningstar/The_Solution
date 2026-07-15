import { AnalyticsDashboard } from "@/features/reporting/components";

export default function ReportsAnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          KPIs, coverage indicators, and trends computed directly from the engineering graph.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
