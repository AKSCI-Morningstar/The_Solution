import { prisma } from "@/server/db";
import {
  Precedent,
  PrecedentCreateInput,
  PrecedentUpdateInput,
  PrecedentFilter,
  PrecedentSearchResult,
  MatchedPrecedent,
  PrecedentMatchContext,
} from "@/features/precedents/types";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { logger } from "@/shared/logging";
import { computeSimilarity } from "./similarity-engine";

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toPrecedent(record: Record<string, unknown>): Precedent {
  return {
    id: record.id as string,
    organizationId: record.organizationId as string,
    title: record.title as string,
    summary: (record.summary as string) ?? null,
    engineeringQuestion: (record.engineeringQuestion as string) ?? null,
    decisionMade: (record.decisionMade as string) ?? null,
    supportingEvidence: parseJsonArray(record.supportingEvidence as string | null),
    contradictions: parseJsonArray(record.contradictions as string | null),
    missingEvidence: parseJsonArray(record.missingEvidence as string | null),
    outcome: (record.outcome as string) ?? null,
    lessonsLearned: parseJsonArray(record.lessonsLearned as string | null),
    relatedProjects: parseJsonArray(record.relatedProjects as string | null),
    relatedSuppliers: parseJsonArray(record.relatedSuppliers as string | null),
    relatedRequirements: parseJsonArray(record.relatedRequirements as string | null),
    relatedDocuments: parseJsonArray(record.relatedDocuments as string | null),
    relatedComponents: parseJsonArray(record.relatedComponents as string | null),
    relatedStandards: parseJsonArray(record.relatedStandards as string | null),
    relatedCertifications: parseJsonArray(record.relatedCertifications as string | null),
    decisionDate: (record.decisionDate as string) ?? null,
    decisionOwner: (record.decisionOwner as string) ?? null,
    confidence: (record.confidence as number) ?? 1.0,
    tags: parseJsonArray(record.tags as string | null),
    organization: (record.organization as string) ?? null,
    version: (record.version as number) ?? 1,
    sourceEntityId: (record.sourceEntityId as string) ?? null,
    sourceAssessmentId: (record.sourceAssessmentId as string) ?? null,
    createdById: (record.createdById as string) ?? null,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
    deletedAt: (record.deletedAt as string) ?? null,
  };
}

function buildWhereClause(filter: PrecedentFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filter.organizationId) {
    where.organizationId = filter.organizationId;
  }

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }

  const AND: Record<string, unknown>[] = [];

  if (filter.search) {
    const search = filter.search.toLowerCase();
    AND.push({
      OR: [
        { title: { contains: search } },
        { summary: { contains: search } },
        { engineeringQuestion: { contains: search } },
        { decisionMade: { contains: search } },
        { outcome: { contains: search } },
        { lessonsLearned: { contains: search } },
        { tags: { contains: search } },
      ],
    });
  }

  if (filter.supplier) {
    AND.push({ relatedSuppliers: { contains: filter.supplier } });
  }
  if (filter.requirement) {
    AND.push({ relatedRequirements: { contains: filter.requirement } });
  }
  if (filter.component) {
    AND.push({ relatedComponents: { contains: filter.component } });
  }
  if (filter.project) {
    AND.push({ relatedProjects: { contains: filter.project } });
  }
  if (filter.certification) {
    AND.push({ relatedCertifications: { contains: filter.certification } });
  }
  if (filter.standard) {
    AND.push({ relatedStandards: { contains: filter.standard } });
  }
  if (filter.dateFrom) {
    AND.push({ decisionDate: { gte: new Date(filter.dateFrom) } });
  }
  if (filter.dateTo) {
    AND.push({ decisionDate: { lte: new Date(filter.dateTo) } });
  }
  if (filter.decisionOwner) {
    AND.push({ decisionOwner: { contains: filter.decisionOwner } });
  }
  if (filter.tags && filter.tags.length > 0) {
    AND.push({
      OR: filter.tags.map((tag) => ({ tags: { contains: tag } })),
    });
  }
  if (filter.confidenceMin !== undefined) {
    AND.push({ confidence: { gte: filter.confidenceMin } });
  }
  if (filter.confidenceMax !== undefined) {
    AND.push({ confidence: { lte: filter.confidenceMax } });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  return where;
}

function buildOrderBy(sortBy?: string, sortOrder?: "asc" | "desc"): Record<string, string> {
  const allowed = ["title", "decisionDate", "confidence", "createdAt", "updatedAt", "decisionOwner"];
  const field = sortBy && allowed.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";
  return { [field]: order };
}

export async function listPrecedents(filter: PrecedentFilter = {}): Promise<PrecedentSearchResult> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
  const where = buildWhereClause(filter);
  const orderBy = buildOrderBy(filter.sortBy, filter.sortOrder);

  const [total, records] = await Promise.all([
    prisma.precedent.count({ where: where as any }),
    prisma.precedent.findMany({
      where: where as any,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: records.map(toPrecedent),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPrecedent(id: string): Promise<Precedent> {
  const record = await prisma.precedent.findFirst({
    where: { id, deletedAt: null },
  });

  if (!record) {
    throw new NotFoundError("Precedent", id);
  }

  return toPrecedent(record as any);
}

export async function getPrecedentWithVersions(id: string): Promise<{
  precedent: Precedent;
  versions: any[];
}> {
  const record = await prisma.precedent.findFirst({
    where: { id, deletedAt: null },
    include: {
      versions: {
        orderBy: { version: "desc" },
      },
    },
  });

  if (!record) {
    throw new NotFoundError("Precedent", id);
  }

  return {
    precedent: toPrecedent(record as any),
    versions: (record as any).versions || [],
  };
}

export async function createPrecedent(
  input: PrecedentCreateInput,
  createdById?: string,
): Promise<Precedent> {
  if (!input.title || input.title.trim().length === 0) {
    throw new ValidationError({ title: ["Title is required"] });
  }

  const record = await prisma.precedent.create({
    data: {
      organizationId: input.organizationId || "",
      title: input.title.trim(),
      summary: input.summary ?? null,
      engineeringQuestion: input.engineeringQuestion ?? null,
      decisionMade: input.decisionMade ?? null,
      supportingEvidence: JSON.stringify(input.supportingEvidence ?? []),
      contradictions: JSON.stringify(input.contradictions ?? []),
      missingEvidence: JSON.stringify(input.missingEvidence ?? []),
      outcome: input.outcome ?? null,
      lessonsLearned: JSON.stringify(input.lessonsLearned ?? []),
      relatedProjects: JSON.stringify(input.relatedProjects ?? []),
      relatedSuppliers: JSON.stringify(input.relatedSuppliers ?? []),
      relatedRequirements: JSON.stringify(input.relatedRequirements ?? []),
      relatedDocuments: JSON.stringify(input.relatedDocuments ?? []),
      relatedComponents: JSON.stringify(input.relatedComponents ?? []),
      relatedStandards: JSON.stringify(input.relatedStandards ?? []),
      relatedCertifications: JSON.stringify(input.relatedCertifications ?? []),
      decisionDate: input.decisionDate ? new Date(input.decisionDate) : null,
      decisionOwner: input.decisionOwner ?? null,
      confidence: input.confidence ?? 1.0,
      tags: JSON.stringify(input.tags ?? []),
      organization: input.organization ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      sourceAssessmentId: input.sourceAssessmentId ?? null,
      createdById: createdById ?? null,
    },
  });

  // Create initial version
  await prisma.precedentVersion.create({
    data: {
      precedentId: record.id,
      version: 1,
      snapshot: JSON.stringify(record),
      changeDescription: "Initial creation",
      createdById: createdById ?? null,
      organizationId: record.organizationId,
    },
  });

  logger.info("Precedent created", { id: record.id, title: record.title });
  return toPrecedent(record as any);
}

export async function updatePrecedent(
  input: PrecedentUpdateInput,
  updatedById?: string,
): Promise<Precedent> {
  const existing = await prisma.precedent.findFirst({
    where: { id: input.id, deletedAt: null },
  });

  if (!existing) {
    throw new NotFoundError("Precedent", input.id);
  }

  const oldSnapshot = JSON.stringify(existing);

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.engineeringQuestion !== undefined) updateData.engineeringQuestion = input.engineeringQuestion;
  if (input.decisionMade !== undefined) updateData.decisionMade = input.decisionMade;
  if (input.supportingEvidence !== undefined) updateData.supportingEvidence = JSON.stringify(input.supportingEvidence);
  if (input.contradictions !== undefined) updateData.contradictions = JSON.stringify(input.contradictions);
  if (input.missingEvidence !== undefined) updateData.missingEvidence = JSON.stringify(input.missingEvidence);
  if (input.outcome !== undefined) updateData.outcome = input.outcome;
  if (input.lessonsLearned !== undefined) updateData.lessonsLearned = JSON.stringify(input.lessonsLearned);
  if (input.relatedProjects !== undefined) updateData.relatedProjects = JSON.stringify(input.relatedProjects);
  if (input.relatedSuppliers !== undefined) updateData.relatedSuppliers = JSON.stringify(input.relatedSuppliers);
  if (input.relatedRequirements !== undefined) updateData.relatedRequirements = JSON.stringify(input.relatedRequirements);
  if (input.relatedDocuments !== undefined) updateData.relatedDocuments = JSON.stringify(input.relatedDocuments);
  if (input.relatedComponents !== undefined) updateData.relatedComponents = JSON.stringify(input.relatedComponents);
  if (input.relatedStandards !== undefined) updateData.relatedStandards = JSON.stringify(input.relatedStandards);
  if (input.relatedCertifications !== undefined) updateData.relatedCertifications = JSON.stringify(input.relatedCertifications);
  if (input.decisionDate !== undefined) updateData.decisionDate = input.decisionDate ? new Date(input.decisionDate) : null;
  if (input.decisionOwner !== undefined) updateData.decisionOwner = input.decisionOwner;
  if (input.confidence !== undefined) updateData.confidence = input.confidence;
  if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
  if (input.organization !== undefined) updateData.organization = input.organization;

  const newVersion = existing.version + 1;
  updateData.version = newVersion;

  // Use raw query to avoid type issues
  const updated = await prisma.precedent.update({
    where: { id: input.id },
    data: updateData as any,
  });

  // Create version record
  await prisma.precedentVersion.create({
    data: {
      precedentId: updated.id,
      version: newVersion,
      snapshot: JSON.stringify(updated),
      changeDescription: null,
      createdById: updatedById ?? null,
      organizationId: updated.organizationId,
    },
  });

  logger.info("Precedent updated", { id: updated.id, version: newVersion });
  return toPrecedent(updated as any);
}

export async function deletePrecedent(
  id: string,
  hardDelete: boolean = false,
): Promise<void> {
  const existing = await prisma.precedent.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new NotFoundError("Precedent", id);
  }

  if (hardDelete) {
    await prisma.precedentVersion.deleteMany({ where: { precedentId: id } });
    await prisma.precedent.delete({ where: { id } });
    logger.info("Precedent hard-deleted", { id });
  } else {
    await prisma.precedent.update({
      where: { id },
      data: { deletedAt: new Date(), version: existing.version + 1 },
    });
    logger.info("Precedent soft-deleted", { id });
  }
}

export async function findSimilarPrecedents(
  context: PrecedentMatchContext,
  organizationId: string,
  minScore: number = 0,
  limit: number = 10,
): Promise<MatchedPrecedent[]> {
  const records = await prisma.precedent.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const precedents = records.map(toPrecedent);
  const results: MatchedPrecedent[] = precedents
    .map((p) => {
      const { score, reasons } = computeSimilarity(p, context);
      return { ...p, similarityScore: score, matchReasons: reasons };
    })
    .filter((p) => p.similarityScore >= minScore)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return results;
}

export async function getPrecedentVersions(id: string): Promise<any[]> {
  const existing = await prisma.precedent.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new NotFoundError("Precedent", id);
  }

  return prisma.precedentVersion.findMany({
    where: { precedentId: id },
    orderBy: { version: "desc" },
  });
}
