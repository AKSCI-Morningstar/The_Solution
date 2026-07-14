import Link from "next/link";
import { StageLogList } from "@/features/reality/components";

export default async function RealityAssessmentLogsPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <Link
          href={`/reality/${assessmentId}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          &larr; Back to assessment
        </Link>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Stage logs</h1>
      </div>
      <StageLogList assessmentId={assessmentId} />
    </div>
  );
}
