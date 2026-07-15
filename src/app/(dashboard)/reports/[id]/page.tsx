import { ReportViewer } from "@/features/reporting/components";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <ReportViewer reportId={id} />
    </div>
  );
}
