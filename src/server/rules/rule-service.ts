import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { recordRuleAudit } from "./audit";
import type { RuleCondition, RuleScope } from "./condition-types";
import {
  checkBrokenConditions,
  checkCircularDependency,
  checkDuplicateName,
  checkMissingReferences,
  type RuleValidationIssue,
} from "./validation-engine";
import type { CreateRuleInput, RuleFilterInput, UpdateRuleInput } from "./validation";

async function assertValid(
  organizationId: string,
  name: string,
  dependsOnRuleIds: string[],
  conditionRoot: RuleCondition,
  excludeRuleId?: string,
): Promise<void> {
  const [existingRules, existingFragments, existingEdges] = await Promise.all([
    prisma.rule.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, organizationId: true },
    }),
    prisma.ruleFragment.findMany({ where: { organizationId }, select: { id: true } }),
    prisma.ruleDependency.findMany({
      where: { organizationId },
      select: { ruleId: true, dependsOnRuleId: true },
    }),
  ]);

  const existingRuleIds = new Set(existingRules.map((r) => r.id));
  const existingFragmentIds = new Set(existingFragments.map((f) => f.id));

  const issues: RuleValidationIssue[] = [
    checkDuplicateName(name, organizationId, existingRules, excludeRuleId),
    ...checkMissingReferences(
      dependsOnRuleIds,
      existingRuleIds,
      conditionRoot,
      existingFragmentIds,
    ),
    ...checkBrokenConditions(conditionRoot),
  ].filter((issue): issue is RuleValidationIssue => issue !== null);

  if (excludeRuleId && dependsOnRuleIds.length > 0) {
    const cycleIssue = checkCircularDependency(excludeRuleId, dependsOnRuleIds, existingEdges);
    if (cycleIssue) issues.push(cycleIssue);
  } else if (!excludeRuleId && dependsOnRuleIds.length > 0) {
    // A brand-new rule can't participate in a cycle with itself using a not-yet-assigned id,
    // but a dependency pointing back at something that (transitively) depends on one of these
    // dependencies would still be invalid once this rule exists - checked with a placeholder id.
    const cycleIssue = checkCircularDependency("__new_rule__", dependsOnRuleIds, existingEdges);
    if (cycleIssue) issues.push(cycleIssue);
  }

  if (issues.length > 0) {
    throw new ValidationError(
      Object.fromEntries(issues.map((issue, index) => [`${issue.code}_${index}`, [issue.message]])),
    );
  }
}

async function replaceDependencies(
  tx: Prisma.TransactionClient,
  organizationId: string,
  ruleId: string,
  dependsOnRuleIds: string[],
): Promise<void> {
  await tx.ruleDependency.deleteMany({ where: { organizationId, ruleId } });
  if (dependsOnRuleIds.length > 0) {
    await tx.ruleDependency.createMany({
      data: dependsOnRuleIds.map((dependsOnRuleId) => ({
        organizationId,
        ruleId,
        dependsOnRuleId,
      })),
    });
  }
}

export async function createRule(organizationId: string, userId: string, input: CreateRuleInput) {
  const dependsOnRuleIds = input.dependsOnRuleIds ?? [];
  await assertValid(organizationId, input.name, dependsOnRuleIds, input.conditionRoot);

  const rule = await prisma.$transaction(async (tx) => {
    const created = await tx.rule.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        category: input.category,
        priority: input.priority,
        severity: input.severity,
        version: 1,
        tags: (input.tags ?? []) as Prisma.InputJsonValue,
        labels: (input.labels ?? {}) as Prisma.InputJsonValue,
        ownerId: input.ownerId,
        scope: input.scope as unknown as Prisma.InputJsonValue,
        conditionRoot: input.conditionRoot as unknown as Prisma.InputJsonValue,
        createdById: userId,
        updatedById: userId,
      },
    });

    await tx.ruleVersion.create({
      data: {
        ruleId: created.id,
        version: 1,
        snapshot: input as unknown as Prisma.InputJsonValue,
        changeDescription: "Initial version",
        createdById: userId,
      },
    });

    await replaceDependencies(tx, organizationId, created.id, dependsOnRuleIds);
    return created;
  });

  await recordRuleAudit(organizationId, "RULE_CREATED", rule.id, {
    name: rule.name,
    category: rule.category,
  });
  logger.info("Rule created", { ruleId: rule.id, organizationId });
  return rule;
}

export async function updateRule(
  ruleId: string,
  organizationId: string,
  userId: string,
  input: UpdateRuleInput,
) {
  const existing = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Rule", ruleId);

  const name = input.name ?? existing.name;
  const conditionRoot = (input.conditionRoot ??
    (existing.conditionRoot as unknown as RuleCondition)) as RuleCondition;
  const dependsOnRuleIds =
    input.dependsOnRuleIds ??
    (
      await prisma.ruleDependency.findMany({
        where: { organizationId, ruleId },
        select: { dependsOnRuleId: true },
      })
    ).map((row) => row.dependsOnRuleId);

  await assertValid(organizationId, name, dependsOnRuleIds, conditionRoot, ruleId);

  const nextVersion = existing.version + 1;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.rule.update({
      where: { id: ruleId },
      data: {
        name,
        description: input.description ?? existing.description,
        category: input.category ?? existing.category,
        priority: input.priority ?? existing.priority,
        severity: input.severity ?? existing.severity,
        version: nextVersion,
        tags: (input.tags ?? (existing.tags as string[] | null) ?? []) as Prisma.InputJsonValue,
        labels: (input.labels ??
          (existing.labels as Record<string, string> | null) ??
          {}) as Prisma.InputJsonValue,
        ownerId: input.ownerId ?? existing.ownerId,
        scope: (input.scope ??
          (existing.scope as unknown as RuleScope)) as unknown as Prisma.InputJsonValue,
        conditionRoot: conditionRoot as unknown as Prisma.InputJsonValue,
        updatedById: userId,
      },
    });

    await tx.ruleVersion.create({
      data: {
        ruleId,
        version: nextVersion,
        snapshot: input as unknown as Prisma.InputJsonValue,
        changeDescription: input.changeDescription ?? `Updated to version ${nextVersion}`,
        createdById: userId,
      },
    });

    await replaceDependencies(tx, organizationId, ruleId, dependsOnRuleIds);
    return result;
  });

  await recordRuleAudit(organizationId, "RULE_UPDATED", ruleId, { version: nextVersion });
  return updated;
}

export async function deleteRule(
  ruleId: string,
  organizationId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Rule", ruleId);

  const dependents = await prisma.ruleDependency.findMany({
    where: { organizationId, dependsOnRuleId: ruleId },
    select: { rule: { select: { name: true } } },
  });
  if (dependents.length > 0) {
    throw new ValidationError({
      dependents: [
        `Cannot delete "${existing.name}" - it is a dependency of: ${dependents.map((d) => d.rule.name).join(", ")}`,
      ],
    });
  }

  await prisma.rule.update({
    where: { id: ruleId },
    data: { deletedAt: new Date(), updatedById: userId },
  });
  await recordRuleAudit(organizationId, "RULE_DELETED", ruleId, { name: existing.name });
}

export async function publishRule(ruleId: string, organizationId: string, userId: string) {
  const existing = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Rule", ruleId);
  if (existing.status !== "DRAFT") {
    throw new ValidationError({
      status: [`Only DRAFT rules can be published (current status: ${existing.status})`],
    });
  }

  const dependsOnRuleIds = (
    await prisma.ruleDependency.findMany({
      where: { organizationId, ruleId },
      select: { dependsOnRuleId: true },
    })
  ).map((row) => row.dependsOnRuleId);
  await assertValid(
    organizationId,
    existing.name,
    dependsOnRuleIds,
    existing.conditionRoot as unknown as RuleCondition,
    ruleId,
  );

  const published = await prisma.rule.update({
    where: { id: ruleId },
    data: { status: "ACTIVE", publishedAt: new Date(), publishedById: userId },
  });

  await recordRuleAudit(organizationId, "RULE_APPROVED", ruleId, { name: existing.name });
  await recordRuleAudit(organizationId, "RULE_PUBLISHED", ruleId, { name: existing.name });
  return published;
}

export async function listRules(organizationId: string, filters: RuleFilterInput) {
  const { status, category, severity, search, tag, page, pageSize } = filters;
  const where: Prisma.RuleWhereInput = { organizationId, deletedAt: null };
  if (status) where.status = status;
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (tag) where.tags = { array_contains: tag };

  const [data, total] = await Promise.all([
    prisma.rule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { dependsOn: true, dependents: true, executionResults: true } },
      },
    }),
    prisma.rule.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getRule(ruleId: string, organizationId: string) {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      dependsOn: { include: { dependsOnRule: { select: { id: true, name: true, status: true } } } },
      dependents: { include: { rule: { select: { id: true, name: true, status: true } } } },
    },
  });
  if (!rule) throw new NotFoundError("Rule", ruleId);
  return rule;
}

export async function getRuleVersions(ruleId: string, organizationId: string) {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId },
    select: { id: true },
  });
  if (!rule) throw new NotFoundError("Rule", ruleId);

  return prisma.ruleVersion.findMany({ where: { ruleId }, orderBy: { version: "desc" } });
}

export async function getRuleDependencies(ruleId: string, organizationId: string) {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId },
    select: { id: true },
  });
  if (!rule) throw new NotFoundError("Rule", ruleId);

  const [upstream, downstream] = await Promise.all([
    prisma.ruleDependency.findMany({
      where: { organizationId, ruleId },
      include: {
        dependsOnRule: { select: { id: true, name: true, status: true, category: true } },
      },
    }),
    prisma.ruleDependency.findMany({
      where: { organizationId, dependsOnRuleId: ruleId },
      include: { rule: { select: { id: true, name: true, status: true, category: true } } },
    }),
  ]);

  return {
    upstream: upstream.map((d) => d.dependsOnRule),
    downstream: downstream.map((d) => d.rule),
  };
}

export async function getRuleResults(
  ruleId: string,
  organizationId: string,
  filters: { outcome?: string; batchId?: string; page: number; pageSize: number },
) {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, organizationId },
    select: { id: true },
  });
  if (!rule) throw new NotFoundError("Rule", ruleId);

  const where: Prisma.RuleExecutionResultWhereInput = { organizationId, ruleId };
  if (filters.outcome) where.outcome = filters.outcome;
  if (filters.batchId) where.batchId = filters.batchId;

  const [data, total] = await Promise.all([
    prisma.ruleExecutionResult.findMany({
      where,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      orderBy: { evaluatedAt: "desc" },
    }),
    prisma.ruleExecutionResult.count({ where }),
  ]);

  return {
    data,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getExecutionResult(resultId: string, organizationId: string) {
  const result = await prisma.ruleExecutionResult.findFirst({
    where: { id: resultId, organizationId },
    include: { rule: { select: { id: true, name: true, category: true } } },
  });
  if (!result) throw new NotFoundError("RuleExecutionResult", resultId);
  return result;
}
