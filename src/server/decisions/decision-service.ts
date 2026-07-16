import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import { ValidationError, NotFoundError } from "@/shared/errors";
import { createPrecedent } from "../precedents/precedent-service";

export interface CreateDecisionInput {
  question: string;
  context?: string;
  organizationId: string;
}

export interface UpdateDecisionInput {
  status?: "INTAKE" | "EVIDENCE_REVIEW" | "FINALIZED";
  subjectEntityId?: string | null;
  supportingEvidence?: Prisma.InputJsonValue;
  contradictions?: Prisma.InputJsonValue;
  unresolvedGaps?: Prisma.InputJsonValue;
  precedents?: Prisma.InputJsonValue;
  finalDecision?: string | null;
  rationale?: string | null;
}

/**
 * Creates a new decision in the INTAKE state.
 */
export async function createDecision(input: CreateDecisionInput) {
  if (!input.question || !input.question.trim()) {
    throw new ValidationError({ question: ["Question is required to start a decision workflow."] });
  }

  return prisma.decision.create({
    data: {
      organizationId: input.organizationId,
      question: input.question.trim(),
      context: input.context?.trim() || null,
      status: "INTAKE",
    },
  });
}

/**
 * Retrieves all decisions for a given organization.
 */
export async function getDecisions(organizationId: string) {
  return prisma.decision.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Retrieves a decision by its ID.
 */
export async function getDecisionById(id: string, organizationId: string) {
  const decision = await prisma.decision.findFirst({
    where: {
      id,
      organizationId,
      deletedAt: null,
    },
  });

  if (!decision) {
    throw new NotFoundError("Decision", id);
  }

  return decision;
}

/**
 * Updates an active decision (e.g. adding evidence, changing status).
 */
export async function updateDecision(
  id: string,
  organizationId: string,
  input: UpdateDecisionInput,
) {
  const decision = await getDecisionById(id, organizationId);

  if (decision.status === "FINALIZED") {
    throw new ValidationError({
      status: ["Cannot update a decision that has already been finalized."],
    });
  }

  if (input.status === "FINALIZED") {
    throw new ValidationError({
      status: ["Use finalizeDecision function to transition status to FINALIZED."],
    });
  }

  if (input.status && !["INTAKE", "EVIDENCE_REVIEW"].includes(input.status)) {
    throw new ValidationError({ status: [`Invalid target status transition: ${input.status}`] });
  }

  return prisma.decision.update({
    where: { id },
    data: {
      status: input.status,
      subjectEntityId: input.subjectEntityId !== undefined ? input.subjectEntityId : undefined,
      supportingEvidence:
        input.supportingEvidence !== undefined ? input.supportingEvidence : undefined,
      contradictions: input.contradictions !== undefined ? input.contradictions : undefined,
      unresolvedGaps: input.unresolvedGaps !== undefined ? input.unresolvedGaps : undefined,
      precedents: input.precedents !== undefined ? input.precedents : undefined,
      finalDecision: input.finalDecision !== undefined ? input.finalDecision : undefined,
      rationale: input.rationale !== undefined ? input.rationale : undefined,
    },
  });
}

/**
 * Validates and finalizes a decision. It sets the status to FINALIZED, stores the final decision
 * and rationale, sets a timestamp and creator, and archives it as a Historical Precedent.
 */
export async function finalizeDecision(
  id: string,
  organizationId: string,
  userId: string,
  finalDecision: string,
  rationale: string,
) {
  const decision = await getDecisionById(id, organizationId);

  if (decision.status === "FINALIZED") {
    throw new ValidationError({ status: ["This decision has already been finalized."] });
  }

  if (!finalDecision || !finalDecision.trim()) {
    throw new ValidationError({
      finalDecision: ["Final decision text is required to sign off and finalize."],
    });
  }

  if (!rationale || !rationale.trim()) {
    throw new ValidationError({
      rationale: ["Rationale and mitigation notes are required to sign off and finalize."],
    });
  }

  // Perform updates
  const updatedDecision = await prisma.decision.update({
    where: { id },
    data: {
      status: "FINALIZED",
      finalDecision: finalDecision.trim(),
      rationale: rationale.trim(),
      finalizedAt: new Date(),
      finalizedById: userId,
    },
  });

  // Archive to Historical Precedents to connect the systems
  try {
    const matchedEnt = decision.subjectEntityId
      ? await prisma.engineeringEntity.findFirst({
          where: { id: decision.subjectEntityId, organizationId },
        })
      : null;

    const components = matchedEnt ? [matchedEnt.name] : [];

    await createPrecedent({
      title: `Finalized Decision: ${decision.question}`,
      summary: rationale.trim(),
      engineeringQuestion: decision.question,
      decisionMade: finalDecision.trim(),
      outcome: "RESOLVED",
      lessonsLearned: rationale.trim(),
      confidence: 1.0,
      tags: ["finalized-decision", matchedEnt?.entityType].filter(Boolean) as string[],
      relatedComponents: components,
      supportingEvidence: decision.supportingEvidence || [],
      contradictions: decision.contradictions || [],
      missingEvidence: decision.unresolvedGaps || [],
      organizationId,
      userId,
    });
  } catch (error) {
    console.error(
      "Failed to automatically archive finalized decision as historical precedent:",
      error,
    );
    // Do not throw so that the main decision transaction succeeds
  }

  return updatedDecision;
}
