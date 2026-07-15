import { AnalyticsDashboard } from "@/features/reporting/components";
import { ShieldCheck, BarChart3, Building } from "lucide-react";

export default function ReportsAnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-center md:justify-between md:gap-0">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Executive Insight Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Measurable enterprise engineering performance, average confidence scores, and truth verification trends.
          </p>
        </div>
        <div className="bg-primary/10 border-primary/25 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="size-3.5" />
          <span>Audit & Boardroom Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-muted/40 border border-border p-5 rounded-lg flex items-start gap-4">
          <div className="bg-primary/15 text-primary p-2 rounded-md shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Average Evidence Completeness</span>
            <span className="text-2xl font-bold text-foreground mt-1 block">96.4%</span>
            <span className="text-xs text-muted-foreground mt-0.5 block">+2.1% growth over previous quarter</span>
          </div>
        </div>

        <div className="bg-muted/40 border border-border p-5 rounded-lg flex items-start gap-4">
          <div className="bg-success/15 text-success p-2 rounded-md shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Contradiction Resolution Time</span>
            <span className="text-2xl font-bold text-foreground mt-1 block">14.2 min</span>
            <span className="text-xs text-muted-foreground mt-0.5 block">-8.4 min improvement this week</span>
          </div>
        </div>

        <div className="bg-muted/40 border border-border p-5 rounded-lg flex items-start gap-4">
          <div className="bg-warning/15 text-warning p-2 rounded-md shrink-0">
            <Building className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Supplier Risk & Compliance Trend</span>
            <span className="text-2xl font-bold text-foreground mt-1 block">Optimal (99.2%)</span>
            <span className="text-xs text-muted-foreground mt-0.5 block">0 critical active violations reported</span>
          </div>
        </div>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
