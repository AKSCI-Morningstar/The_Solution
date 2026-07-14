import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/** Shared by rule-service.ts and engine/orchestrator.ts so every Rule Engine mutation writes one consistent, org-scoped audit trail. */
export async function recordRuleAudit(
  organizationId: string,
  action: string,
  ruleId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId,
      action,
      entity: "Rule",
      entityId: ruleId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}
