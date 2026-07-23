/* eslint-disable @typescript-eslint/no-explicit-any */

export interface JobState {
  id: string;
  type: "ImportCsvJob" | "GenerateMetricsJob" | "BulkApproveJob" | "DetectAnomaliesJob";
  status: "queued" | "processing" | "completed" | "failed";
  progressPct: number;
  processedRows: number;
  totalRows: number;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const jobStore = new Map<string, JobState>();

export function createAsyncJob(type: JobState["type"], totalRows: number = 100): JobState {
  const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: JobState = {
    id,
    type,
    status: "queued",
    progressPct: 0,
    processedRows: 0,
    totalRows,
    createdAt: new Date(),
  };

  jobStore.set(id, job);
  processJobAsync(id);
  return job;
}

export function getJobState(id: string): JobState | null {
  return jobStore.get(id) || null;
}

export function cancelAsyncJob(id: string): boolean {
  const job = jobStore.get(id);
  if (!job || job.status === "completed" || job.status === "failed") return false;

  job.status = "failed";
  job.error = "Job cancelled by user";
  job.completedAt = new Date();
  jobStore.set(id, job);
  return true;
}

async function processJobAsync(id: string) {
  const job = jobStore.get(id);
  if (!job) return;

  job.status = "processing";
  jobStore.set(id, job);

  try {
    const steps = Math.min(job.totalRows, 10);
    const stepSize = Math.max(1, Math.floor(job.totalRows / steps));

    for (let i = 1; i <= steps; i++) {
      await new Promise((res) => setTimeout(res, 200));

      // Check if cancelled
      const current = jobStore.get(id);
      if (current && current.status === "failed") return;

      job.processedRows = Math.min(i * stepSize, job.totalRows);
      job.progressPct = Math.floor((job.processedRows / job.totalRows) * 100);
      jobStore.set(id, job);
    }

    job.status = "completed";
    job.progressPct = 100;
    job.processedRows = job.totalRows;
    job.completedAt = new Date();
    job.result = { message: `Async ${job.type} processed ${job.totalRows} records successfully.` };
    jobStore.set(id, job);
  } catch (err: any) {
    job.status = "failed";
    job.error = err.message || "Execution error in async job";
    job.completedAt = new Date();
    jobStore.set(id, job);
  }
}
