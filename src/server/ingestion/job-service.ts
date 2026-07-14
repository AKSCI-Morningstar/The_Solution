import { prisma } from "@/server/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { PIPELINE_STAGES } from "./constants";
import { parserRegistry } from "./parsers";
import { startQueueLoop } from "./queue";
import type { JobFilterInput, StartJobInput } from "./validation";
import { getDocument } from "./document-service";

export async function createJob(organizationId: string, userId: string, input: StartJobInput) {
  const document = await prisma.ingestionDocument.findFirst({
    where: { id: input.documentId, organizationId, deletedAt: null },
  });
  if (!document) throw new NotFoundError("IngestionDocument", input.documentId);

  const documentVersionId = input.documentVersionId;
  const version = documentVersionId
    ? await prisma.ingestionDocumentVersion.findFirst({
        where: { id: documentVersionId, documentId: document.id },
      })
    : await prisma.ingestionDocumentVersion.findUnique({
        where: {
          documentId_version: { documentId: document.id, version: document.currentVersion },
        },
      });
  if (!version) throw new NotFoundError("IngestionDocumentVersion", documentVersionId ?? "current");

  const job = await prisma.ingestionJob.create({
    data: {
      organizationId,
      documentId: document.id,
      documentVersionId: version.id,
      totalStages: PIPELINE_STAGES.length,
      priority: input.priority,
      scheduledAt: input.scheduledAt ?? new Date(),
      createdById: userId,
    },
  });

  startQueueLoop();
  logger.info("Ingestion job queued", { jobId: job.id, documentId: document.id });
  return job;
}

export async function reprocessDocument(
  documentId: string,
  organizationId: string,
  userId: string,
) {
  const document = await getDocument(documentId, organizationId);
  return createJob(organizationId, userId, {
    documentId: document.id,
    documentVersionId: undefined,
    priority: 0,
    scheduledAt: undefined,
  });
}

export async function listJobs(organizationId: string, filters: JobFilterInput) {
  const { status, documentId, page, pageSize } = filters;
  const where: Record<string, unknown> = { organizationId };
  if (status) where.status = status;
  if (documentId) where.documentId = documentId;

  const [data, total] = await Promise.all([
    prisma.ingestionJob.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        document: { select: { id: true, fileName: true, fileExtension: true } },
        _count: {
          select: {
            extractedEntities: true,
            extractedRelationships: true,
            extractedReferences: true,
          },
        },
      },
    }),
    prisma.ingestionJob.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getJob(jobId: string, organizationId: string) {
  const job = await prisma.ingestionJob.findFirst({
    where: { id: jobId, organizationId },
    include: {
      document: { select: { id: true, fileName: true, fileExtension: true } },
      documentVersion: { select: { id: true, version: true, fileName: true } },
      stageLogs: { orderBy: { stageIndex: "asc" } },
    },
  });
  if (!job) throw new NotFoundError("IngestionJob", jobId);
  return job;
}

export async function getJobResults(
  jobId: string,
  organizationId: string,
  filters: { page: number; pageSize: number },
) {
  const job = await prisma.ingestionJob.findFirst({ where: { id: jobId, organizationId } });
  if (!job) throw new NotFoundError("IngestionJob", jobId);

  const { page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  const [entities, entityTotal, relationships, references, issues] = await Promise.all([
    prisma.extractedEntity.findMany({
      where: { jobId },
      skip,
      take: pageSize,
      orderBy: { page: "asc" },
    }),
    prisma.extractedEntity.count({ where: { jobId } }),
    prisma.extractedRelationship.findMany({ where: { jobId }, take: 500 }),
    prisma.extractedReference.findMany({ where: { jobId }, take: 500 }),
    prisma.ingestionValidationIssue.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } }),
  ]);

  return {
    entities: {
      data: entities,
      total: entityTotal,
      page,
      pageSize,
      totalPages: Math.ceil(entityTotal / pageSize),
    },
    relationships,
    references,
    issues,
    graphPreview: job.graphPreview,
  };
}

export async function cancelJob(jobId: string, organizationId: string) {
  const job = await prisma.ingestionJob.findFirst({ where: { id: jobId, organizationId } });
  if (!job) throw new NotFoundError("IngestionJob", jobId);

  if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED") {
    throw new ValidationError({
      status: [`Job is already ${job.status.toLowerCase()} and cannot be cancelled`],
    });
  }

  if (job.status === "QUEUED") {
    return prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED", cancelRequested: true, completedAt: new Date() },
    });
  }

  // RUNNING: signal the orchestrator, which checks this flag between stages.
  return prisma.ingestionJob.update({ where: { id: jobId }, data: { cancelRequested: true } });
}

export async function retryJob(jobId: string, organizationId: string) {
  const job = await prisma.ingestionJob.findFirst({ where: { id: jobId, organizationId } });
  if (!job) throw new NotFoundError("IngestionJob", jobId);

  if (job.status !== "FAILED" && job.status !== "CANCELLED") {
    throw new ForbiddenError(
      `Only failed or cancelled jobs can be retried (current status: ${job.status})`,
    );
  }
  if (job.attempt >= job.maxAttempts) {
    throw new ValidationError({
      attempt: [`Job has reached its maximum of ${job.maxAttempts} attempts`],
    });
  }

  const retried = await prisma.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      attempt: job.attempt + 1,
      cancelRequested: false,
      currentStage: null,
      stageIndex: 0,
      progressPercent: 0,
      errorMessage: null,
      errorStage: null,
      scheduledAt: new Date(),
      startedAt: null,
      completedAt: null,
    },
  });

  startQueueLoop();
  return retried;
}

export function getParserHealth() {
  return parserRegistry.listHealth();
}
