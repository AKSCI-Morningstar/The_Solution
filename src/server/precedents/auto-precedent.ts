import { prisma } from "@/server/db";
import { createPrecedent, updatePrecedent } from "./precedent-service";
import { PrecedentCreateInput, PrecedentMatchContext } from "@/features/precedents/types";
import { logger } from "@/shared/logging";

interface DecisionData {
  organizationId: string;
  userId?: string;
  question?: string;
  entityId?: string;
  entityName?: string;
  entityType?: string;
  decision?: string;
  outcome?: string;
  supportingEvidence?: string[];
  contradictions?: string[];
  missingEvidence?: string[];
  suppliers?: string[];
  components?: string[];
  standards?: string[];
  certifications?: string[];
  requirements?: string[];
  documents?: string[];
  tags?: string[];
  confidence?: number;
}

/**
 * Automatically create or update a precedent based on completed decision data.
 * Uses deterministic dedup: if a precedent already exists for the same source entity
 * with the same title/question, it updates rather than duplicates.
 */
export async function autoCreatePrecedent(data: DecisionData): Promise<void> {
  if (!data.organizationId) {
    logger.warn("autoCreatePrecedent skipped: no organizationId");
    return;
  }

  const title = data.entityName
    ? `Decision: ${data.entityName}`
    : data.question
      ? `Decision: ${data.question.slice(0, 80)}`
      : `Engineering Decision ${new Date().toISOString().slice(0, 10)}`;

  // Check for existing precedent by source entity or similar title
  const existing = await prisma.precedent.findFirst({
    where: {
      organizationId: data.organizationId,
      deletedAt: null,
      OR: [
        data.entityId ? { sourceEntityId: data.entityId } : { id: "" },
        { title: { contains: title.slice(0, 60) } },
      ].filter(Boolean),
    },
    orderBy: { createdAt: "desc" },
  });

  const input: PrecedentCreateInput = {
    organizationId: data.organizationId,
    title,
    summary: data.question ? `Engineering decision for: ${data.question}` : `Engineering decision for ${data.entityName || "unknown entity"}`,
    engineeringQuestion: data.question || null,
    decisionMade: data.decision || null,
    outcome: data.outcome || null,
    supportingEvidence: data.supportingEvidence || [],
    contradictions: data.contradictions || [],
    missingEvidence: data.missingEvidence || [],
    relatedSuppliers: data.suppliers || [],
    relatedComponents: data.components || [],
    relatedStandards: data.standards || [],
    relatedCertifications: data.certifications || [],
    relatedRequirements: data.requirements || [],
    relatedDocuments: data.documents || [],
    tags: data.tags || [],
    confidence: data.confidence ?? 0.9,
    decisionDate: new Date().toISOString(),
    decisionOwner: null,
    sourceEntityId: data.entityId || null,
  };

  if (existing) {
    await updatePrecedent(
      {
        id: existing.id,
        ...input,
      },
      data.userId,
    );
    logger.info("Auto-precedent updated", { id: existing.id, title });
  } else {
    await createPrecedent(input, data.userId);
    logger.info("Auto-precedent created", { title });
  }
}

/**
 * Extracts relevant context from a resolution result to create a precedent match context.
 */
export function buildPrecedentMatchContext(data: DecisionData): PrecedentMatchContext {
  return {
    suppliers: data.suppliers,
    components: data.components,
    requirements: data.requirements,
    standards: data.standards,
    certifications: data.certifications,
    documents: data.documents,
    contradictions: data.contradictions,
    evidence: data.supportingEvidence,
    tags: data.tags,
    question: data.question,
  };
}

/**
 * Call this from the orchestrator pipeline after a successful assessment.
 */
export async function createPrecedentFromAssessment(input: {
  organizationId: string;
  assessmentId?: string;
  entityId: string;
  entityName: string;
  entityType: string;
  question?: string;
  outcome?: string;
  userId?: string;
}): Promise<void> {
  await autoCreatePrecedent({
    organizationId: input.organizationId,
    userId: input.userId,
    question: input.question,
    entityId: input.entityId,
    entityName: input.entityName,
    entityType: input.entityType,
    outcome: input.outcome || "Assessment completed",
    tags: [input.entityType.toLowerCase()],
  });
}
