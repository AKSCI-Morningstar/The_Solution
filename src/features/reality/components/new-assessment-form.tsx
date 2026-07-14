"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orchestrationRunId, setOrchestrationRunId] = useState(
    () => searchParams.get("orchestrationRunId") ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reality/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orchestrationRunId: orchestrationRunId.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start assessment");
        setIsSubmitting(false);
        return;
      }
      router.push(`/reality/${json.data.id}`);
    } catch {
      setError("Failed to start assessment");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="orchestrationRunId" className="text-foreground text-sm font-medium">
          Orchestration run ID
        </label>
        <Input
          id="orchestrationRunId"
          value={orchestrationRunId}
          onChange={(e) => setOrchestrationRunId(e.target.value)}
          placeholder="A completed OrchestrationRun ID"
          required
        />
        <p className="text-muted-foreground text-xs">
          The Reality Engine reinterprets a completed Orchestration Run&rsquo;s outputs - it never
          re-executes the Rule or Contradiction engines. Pick a run whose status is COMPLETED from{" "}
          <Link href="/orchestrator" className="hover:underline">
            the Orchestrator
          </Link>
          .
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isSubmitting || !orchestrationRunId.trim()}>
        {isSubmitting ? "Starting..." : "Assess reality"}
      </Button>
    </form>
  );
}
