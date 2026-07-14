"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import {
  ExtractionSummary,
  JobProgress,
  JobStatusBadge,
  ValidationIssuesList,
  type ExtractedEntityItem,
  type StageLogItem,
  type ValidationIssueItem,
} from "@/features/ingestion/components";

const TERMINAL_STATUSES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);
const POLL_INTERVAL_MS = 2000;

interface JobDetail {
  id: string;
  status: string;
  documentType: string | null;
  progressPercent: number;
  attempt: number;
  maxAttempts: number;
  errorStage: string | null;
  errorMessage: string | null;
  document: { fileName: string; fileExtension: string };
  documentVersion: { version: number };
  stageLogs: StageLogItem[];
}

export default function IngestionJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [entities, setEntities] = useState<ExtractedEntityItem[]>([]);
  const [issues, setIssues] = useState<ValidationIssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const jobRes = await fetch(`/api/ingestion/jobs/${params.jobId}`);
        if (!jobRes.ok) return;
        const { data: jobData } = await jobRes.json();
        if (cancelled) return;
        setJob(jobData);

        const resultsRes = await fetch(`/api/ingestion/jobs/${params.jobId}/results`);
        if (resultsRes.ok) {
          const { data: results } = await resultsRes.json();
          if (!cancelled) {
            setEntities(results.entities.data);
            setIssues(results.issues);
          }
        }

        if (TERMINAL_STATUSES.has(jobData.status)) {
          clearInterval(intervalId);
        }
      } catch {
        // silently fail; next poll tick will retry
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const intervalId = setInterval(load, POLL_INTERVAL_MS);
    load();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [params.jobId]);

  async function handleCancel() {
    await fetch(`/api/ingestion/jobs/${params.jobId}/cancel`, { method: "POST" });
  }

  async function handleRetry() {
    const res = await fetch(`/api/ingestion/jobs/${params.jobId}/retry`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  if (isLoading && !job) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/ingestion")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                {job.document.fileName}
              </h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              v{job.documentVersion.version} ·{" "}
              {job.documentType?.replaceAll("_", " ") ?? "Unclassified"} · attempt {job.attempt}/
              {job.maxAttempts}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(job.status === "QUEUED" || job.status === "RUNNING") && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          {(job.status === "FAILED" || job.status === "CANCELLED") &&
            job.attempt < job.maxAttempts && (
              <Button variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            )}
        </div>
      </div>

      {job.errorMessage && (
        <Card>
          <CardContent className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
            <span className="font-medium">{job.errorStage?.replaceAll("_", " ")}: </span>
            {job.errorMessage}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border-border flex gap-4 border-b">
          <TabsTrigger
            value="progress"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Progress
          </TabsTrigger>
          <TabsTrigger
            value="entities"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Extraction Summary
          </TabsTrigger>
          <TabsTrigger
            value="issues"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Validation Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6">
          <JobProgress
            progressPercent={job.progressPercent}
            status={job.status}
            stageLogs={job.stageLogs}
          />
        </TabsContent>

        <TabsContent value="entities" className="mt-6">
          <ExtractionSummary entities={entities} />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <ValidationIssuesList issues={issues} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
