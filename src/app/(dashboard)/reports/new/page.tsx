import { ReportBuilderForm } from "@/features/reporting/components";

export default function NewReportPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Report Builder</h1>
        <p className="text-muted-foreground text-sm">
          Choose a report type and optional filters, then generate.
        </p>
      </div>
      <ReportBuilderForm />
    </div>
  );
}
