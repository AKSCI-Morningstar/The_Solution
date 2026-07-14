import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { logger } from "@/shared/logging";
import { NotFoundError } from "@/shared/errors";
import { RULE_EXECUTION_CONCURRENCY } from "../constants";
import type { RuleCondition } from "../condition-types";
import { extractFragmentIds } from "../validation-engine";
import { evaluateCondition, collectMatchedEntityIds } from "./evaluate-condition";
import { resolveEvidence, type ExtractionRecord } from "./evidence-resolution";
import { topologicalOrder, type DependencyEdge } from "./dependency-graph";
import type { EvaluationContext, SubjectEntity } from "./types";

function toSubjectEntity(entity: {
  id: string;
  entityType: string;
  identifier: string;
  name: string;
  status: string;
  metadata: Prisma.JsonValue;
  tags: Prisma.JsonValue;
  labels: Prisma.JsonValue;
}): SubjectEntity {
  return {
    id: entity.id,
    entityType: entity.entityType,
    identifier: entity.identifier,
    name: entity.name,
    status: entity.status,
    metadata: (entity.metadata as Record<string, unknown> | null) ?? null,
    tags: (entity.tags as string[] | null) ?? null,
    labels: (entity.labels as Record<string, string> | null) ?? null,
  };
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface RuleForExecution {
  id: string;
  organizationId: string;
  name: string;
  version: number;
  scope: Prisma.JsonValue;
  conditionRoot: Prisma.JsonValue;
}

export interface ExecuteRuleOptions {
  subjectEntityId?: string;
  force?: boolean;
  batchId?: string;
  triggeredById?: string;
}

export interface RuleExecutionOutcomeRecord {
  id: string;
  ruleId: string;
  subjectEntityId: string;
  outcome: string;
  cached: boolean;
}

/**
 * Builds one shared EvaluationContext for every candidate entity in a single
 * rule run: one batched relationship query + one batched "other side entity"
 * query + one batched fragment fetch, instead of a per-entity round trip.
 * This is what makes evaluating a rule across a large candidate population
 * tractable.
 */
async function buildSharedContext(
  organizationId: string,
  candidates: SubjectEntity[],
  conditionRoot: RuleCondition,
): Promise<EvaluationContext> {
  const candidateIds = candidates.map((c) => c.id);

  const relationships =
    candidateIds.length > 0
      ? await prisma.engineeringRelationship.findMany({
          where: {
            organizationId,
            OR: [
              { sourceEntityId: { in: candidateIds } },
              { targetEntityId: { in: candidateIds } },
            ],
          },
          select: { relationshipType: true, sourceEntityId: true, targetEntityId: true },
        })
      : [];

  const relatedIds = new Set<string>();
  for (const rel of relationships) {
    relatedIds.add(rel.sourceEntityId);
    relatedIds.add(rel.targetEntityId);
  }
  for (const id of candidateIds) relatedIds.add(id);

  const relatedEntities = await prisma.engineeringEntity.findMany({
    where: { id: { in: Array.from(relatedIds) }, organizationId, deletedAt: null },
    select: {
      id: true,
      entityType: true,
      identifier: true,
      name: true,
      status: true,
      metadata: true,
      tags: true,
      labels: true,
    },
  });

  const entitiesById: Record<string, SubjectEntity> = {};
  for (const entity of relatedEntities) {
    entitiesById[entity.id] = toSubjectEntity(entity);
  }

  const fragmentIds = extractFragmentIds(conditionRoot);
  const fragmentRows =
    fragmentIds.length > 0
      ? await prisma.ruleFragment.findMany({
          where: { id: { in: fragmentIds }, organizationId },
          select: { id: true, condition: true },
        })
      : [];
  const fragments: Record<string, RuleCondition> = {};
  for (const fragment of fragmentRows) {
    fragments[fragment.id] = fragment.condition as unknown as RuleCondition;
  }

  return { relationships, entitiesById, fragments };
}

async function fetchMatchingExtractions(
  organizationId: string,
  entityType: string,
  identifier: string,
): Promise<ExtractionRecord[]> {
  const rows = await prisma.extractedEntity.findMany({
    where: { organizationId, entityType, identifier },
    select: {
      id: true,
      documentId: true,
      documentVersionId: true,
      page: true,
      section: true,
      attributes: true,
      confidence: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    documentId: row.documentId,
    documentVersionId: row.documentVersionId,
    page: row.page,
    section: row.section,
    attributes: (row.attributes as Record<string, unknown> | null) ?? null,
    confidence: row.confidence,
  }));
}

/** Latest result per dependency rule for this specific subject entity - dependency gating is per-subject, not global. */
async function getUnmetDependencies(
  organizationId: string,
  ruleId: string,
  subjectEntityId: string,
): Promise<string[]> {
  const dependencies = await prisma.ruleDependency.findMany({
    where: { organizationId, ruleId },
    select: { dependsOnRuleId: true, dependsOnRule: { select: { name: true } } },
  });
  if (dependencies.length === 0) return [];

  const unmet: string[] = [];
  for (const dependency of dependencies) {
    const latest = await prisma.ruleExecutionResult.findFirst({
      where: { organizationId, ruleId: dependency.dependsOnRuleId, subjectEntityId },
      orderBy: { evaluatedAt: "desc" },
    });
    if (!latest || latest.outcome !== "PASSED") {
      unmet.push(dependency.dependsOnRule.name);
    }
  }
  return unmet;
}

async function recordAudit(
  action: string,
  ruleId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: { action, entity: "Rule", entityId: ruleId, metadata: metadata as Prisma.InputJsonValue },
  });
}

/**
 * Evaluates one rule against every EngineeringEntity matching its scope (or
 * just `options.subjectEntityId` if given), persisting an immutable
 * RuleExecutionResult per subject. Reuses a valid cached result (same rule
 * version, evaluated after the subject's last update) instead of
 * re-evaluating, unless `force` is set.
 */
export async function executeRule(
  ruleId: string,
  organizationId: string,
  options: ExecuteRuleOptions = {},
): Promise<RuleExecutionOutcomeRecord[]> {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId, deletedAt: null },
    select: {
      id: true,
      organizationId: true,
      name: true,
      version: true,
      scope: true,
      conditionRoot: true,
    },
  });
  if (!rule) throw new NotFoundError("Rule", ruleId);

  const scope = rule.scope as unknown as { entityType: string; filter?: RuleCondition };
  const conditionRoot = rule.conditionRoot as unknown as RuleCondition;

  const entityWhere: Prisma.EngineeringEntityWhereInput = {
    organizationId,
    entityType: scope.entityType,
    deletedAt: null,
  };
  if (options.subjectEntityId) entityWhere.id = options.subjectEntityId;

  const rawCandidates = await prisma.engineeringEntity.findMany({
    where: entityWhere,
    select: {
      id: true,
      entityType: true,
      identifier: true,
      name: true,
      status: true,
      metadata: true,
      tags: true,
      labels: true,
      updatedAt: true,
    },
  });

  if (options.subjectEntityId && rawCandidates.length === 0) {
    throw new NotFoundError("EngineeringEntity", options.subjectEntityId);
  }

  let candidates = rawCandidates.map((row) => ({
    subject: toSubjectEntity(row),
    updatedAt: row.updatedAt,
  }));

  const ctx = await buildSharedContext(
    organizationId,
    candidates.map((c) => c.subject),
    conditionRoot,
  );

  if (scope.filter) {
    const scopeFilter = scope.filter;
    candidates = candidates.filter(
      (candidate) => evaluateCondition(scopeFilter, ctx, { subject: candidate.subject }).result,
    );
  }

  const outcomes = await runWithConcurrency(
    candidates,
    RULE_EXECUTION_CONCURRENCY,
    async ({ subject, updatedAt }) => {
      try {
        return await evaluateForSubject(
          rule,
          organizationId,
          subject,
          updatedAt,
          ctx,
          conditionRoot,
          options,
        );
      } catch (error) {
        logger.error("Rule execution failed for subject", {
          ruleId,
          subjectEntityId: subject.id,
          error: error instanceof Error ? error.message : String(error),
        });
        await recordAudit("RULE_EXECUTION_FAILED", ruleId, {
          subjectEntityId: subject.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  );

  return outcomes;
}

async function evaluateForSubject(
  rule: RuleForExecution,
  organizationId: string,
  subject: SubjectEntity,
  subjectUpdatedAt: Date,
  ctx: EvaluationContext,
  conditionRoot: RuleCondition,
  options: ExecuteRuleOptions,
): Promise<RuleExecutionOutcomeRecord> {
  if (!options.force) {
    const cached = await prisma.ruleExecutionResult.findFirst({
      where: {
        organizationId,
        ruleId: rule.id,
        subjectEntityId: subject.id,
        ruleVersion: rule.version,
      },
      orderBy: { evaluatedAt: "desc" },
    });
    if (cached && cached.evaluatedAt >= subjectUpdatedAt) {
      return {
        id: cached.id,
        ruleId: rule.id,
        subjectEntityId: subject.id,
        outcome: cached.outcome,
        cached: true,
      };
    }
  }

  const startedAt = Date.now();

  const unmetDependencies = await getUnmetDependencies(organizationId, rule.id, subject.id);
  if (unmetDependencies.length > 0) {
    const created = await prisma.ruleExecutionResult.create({
      data: {
        organizationId,
        ruleId: rule.id,
        ruleVersion: rule.version,
        subjectEntityId: subject.id,
        batchId: options.batchId,
        outcome: "BLOCKED",
        trace: {
          type: "dependency-gate",
          description: `Blocked by unmet dependencies: ${unmetDependencies.join(", ")}`,
          result: false,
        } as Prisma.InputJsonValue,
        supportingEntityIds: [] as Prisma.InputJsonValue,
        supportingDocumentRefs: [] as Prisma.InputJsonValue,
        missingEvidence: unmetDependencies as Prisma.InputJsonValue,
        conflictingEvidence: [] as Prisma.InputJsonValue,
        executionTimeMs: Date.now() - startedAt,
        triggeredById: options.triggeredById,
      },
    });
    return {
      id: created.id,
      ruleId: rule.id,
      subjectEntityId: subject.id,
      outcome: "BLOCKED",
      cached: false,
    };
  }

  const extractions = await fetchMatchingExtractions(
    organizationId,
    subject.entityType,
    subject.identifier,
  );
  const evidence = resolveEvidence(subject, extractions);
  const conditionEval = evaluateCondition(conditionRoot, ctx, { subject });

  let outcome: string;
  if (conditionEval.missingFields.length > 0) {
    outcome = "INSUFFICIENT_EVIDENCE";
  } else if (evidence.conflictingEvidence.length > 0) {
    outcome = "NEEDS_REVIEW";
  } else {
    outcome = conditionEval.result ? "PASSED" : "FAILED";
  }

  const supportingEntityIds = Array.from(
    new Set([subject.id, ...collectMatchedEntityIds(conditionEval.trace)]),
  );

  const created = await prisma.ruleExecutionResult.create({
    data: {
      organizationId,
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectEntityId: subject.id,
      batchId: options.batchId,
      outcome,
      trace: conditionEval.trace as unknown as Prisma.InputJsonValue,
      supportingEntityIds: supportingEntityIds as Prisma.InputJsonValue,
      supportingDocumentRefs: evidence.supportingDocumentRefs as unknown as Prisma.InputJsonValue,
      missingEvidence: conditionEval.missingFields as Prisma.InputJsonValue,
      conflictingEvidence: evidence.conflictingEvidence as unknown as Prisma.InputJsonValue,
      executionTimeMs: Date.now() - startedAt,
      triggeredById: options.triggeredById,
    },
  });

  await recordAudit("RULE_EXECUTED", rule.id, { subjectEntityId: subject.id, outcome });

  return { id: created.id, ruleId: rule.id, subjectEntityId: subject.id, outcome, cached: false };
}

export interface ExecuteBatchOptions {
  force?: boolean;
  triggeredById?: string;
}

/** Executes multiple rules in dependency order (dependencies first), sharing one batchId to correlate the run. */
export async function executeBatch(
  ruleIds: string[],
  organizationId: string,
  options: ExecuteBatchOptions = {},
): Promise<Record<string, RuleExecutionOutcomeRecord[]>> {
  const edges: DependencyEdge[] = (
    await prisma.ruleDependency.findMany({
      where: { organizationId, ruleId: { in: ruleIds } },
      select: { ruleId: true, dependsOnRuleId: true },
    })
  ).map((row) => ({ ruleId: row.ruleId, dependsOnRuleId: row.dependsOnRuleId }));

  const order = topologicalOrder(ruleIds, edges);
  const batchId = randomUUID();
  const results: Record<string, RuleExecutionOutcomeRecord[]> = {};

  for (const ruleId of order) {
    results[ruleId] = await executeRule(ruleId, organizationId, {
      force: options.force,
      batchId,
      triggeredById: options.triggeredById,
    });
  }

  return results;
}
