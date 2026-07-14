"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewRunForm() {
  const router = useRouter();
  const [subjectEntityId, setSubjectEntityId] = useState("");
  const [maxDepth, setMaxDepth] = useState("3");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orchestrator/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectEntityId: subjectEntityId.trim(),
          maxDepth: Number(maxDepth),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start evaluation");
        setIsSubmitting(false);
        return;
      }
      router.push(`/orchestrator/${json.data.id}`);
    } catch {
      setError("Failed to start evaluation");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="subjectEntityId" className="text-foreground text-sm font-medium">
          Subject entity ID
        </label>
        <Input
          id="subjectEntityId"
          value={subjectEntityId}
          onChange={(e) => setSubjectEntityId(e.target.value)}
          placeholder="EngineeringEntity ID"
          required
        />
        <p className="text-muted-foreground text-xs">
          The Orchestrator evaluates this entity against every ACTIVE rule scoped to its type, using
          the Knowledge Graph, Evidence Resolution, Contradiction, and Traceability engines. It
          never invents a conclusion - if supporting evidence is unavailable, the run&rsquo;s
          outcome is INSUFFICIENT_EVIDENCE.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="maxDepth" className="text-foreground text-sm font-medium">
          Max relationship depth
        </label>
        <Input
          id="maxDepth"
          type="number"
          min={1}
          max={10}
          value={maxDepth}
          onChange={(e) => setMaxDepth(e.target.value)}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isSubmitting || !subjectEntityId.trim()}>
        {isSubmitting ? "Starting..." : "Start evaluation"}
      </Button>
    </form>
  );
}
