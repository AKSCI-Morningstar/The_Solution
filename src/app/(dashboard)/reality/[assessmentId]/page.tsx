import { AssessmentDetail } from "@/features/reality/components";

export default async function RealityAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <AssessmentDetail assessmentId={assessmentId} />
    </div>
  );
}
