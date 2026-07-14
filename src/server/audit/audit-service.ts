import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/**
 * The one place every subsystem writes to the generic, organization-scoped
 * AuditLog table - Rule Engine mutations, Orchestrator run lifecycle events,
 * and anything else that needs an immutable "who did what, when" record.
 * Entries are never updated or deleted by application code.
 */
export async function recordAuditEvent(
  organizationId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId,
      action,
      entity,
      entityId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}
