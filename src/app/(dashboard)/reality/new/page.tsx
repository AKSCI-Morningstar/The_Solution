import { Suspense } from "react";
import { NewAssessmentForm } from "@/features/reality/components";

function NewRealityAssessmentPageInner() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          New reality assessment
        </h1>
        <p className="text-muted-foreground text-sm">
          Assess engineering reality for a completed orchestration run.
        </p>
      </div>
      <NewAssessmentForm />
    </div>
  );
}

export default function NewRealityAssessmentPage() {
  return (
    <Suspense>
      <NewRealityAssessmentPageInner />
    </Suspense>
  );
}
