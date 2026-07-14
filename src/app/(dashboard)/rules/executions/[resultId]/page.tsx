"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvidencePanel, RuleOutcomeBadge, TraceViewer } from "@/features/rules/components";

interface TraceNode {
  type: string;
  description: string;
  result: boolean;
  children?: TraceNode[];
  detail?: Record<string, unknown>;
}

interface ExecutionResultDetail {
  id: string;
  outcome: string;
  subjectEntityId: string;
  ruleVersion: number;
  evaluatedAt: string;
  executionTimeMs: number;
  trace: TraceNode;
  supportingDocumentRefs: {
    extractedEntityId: string;
    documentId: string;
    documentVersionId: string;
    page: number | null;
    section: string | null;
    confidence: number;
  }[];
  missingEvidence: string[];
  conflictingEvidence: {
    attribute: string;
    canonicalValue: unknown;
    extractedValue: unknown;
    extractedEntityId: string;
    documentId: string;
  }[];
  rule: { id: string; name: string; category: string };
}

export default function ExecutionResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<ExecutionResultDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/rules/executions/${resultId}`);
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Failed to load execution result");
          return;
        }
        if (!cancelled) setResult(json.data);
      } catch {
        if (!cancelled) setError("Failed to load execution result");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [resultId]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-muted-foreground text-sm">Loading execution result...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Execution result</h1>
          <RuleOutcomeBadge outcome={result.outcome} />
        </div>
        <p className="text-muted-foreground text-sm">
          Rule{" "}
          <Link href={`/rules/${result.rule.id}`} className="hover:underline">
            {result.rule.name}
          </Link>{" "}
          (v{result.ruleVersion}) evaluated against entity{" "}
          <code className="text-xs">{result.subjectEntityId}</code>
        </p>
        <p className="text-muted-foreground text-xs">
          {new Date(result.evaluatedAt).toLocaleString()} - {result.executionTimeMs}ms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation trace</CardTitle>
        </CardHeader>
        <CardContent>
          <TraceViewer node={result.trace} />
        </CardContent>
      </Card>

      <EvidencePanel
        supportingDocumentRefs={result.supportingDocumentRefs}
        conflictingEvidence={result.conflictingEvidence}
        missingEvidence={result.missingEvidence}
      />
    </div>
  );
}
