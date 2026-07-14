import { recordAuditEvent } from "@/server/audit";

/** Thin, Rule-Engine-specific wrapper over the shared audit writer - keeps call sites in rule-service.ts and engine/orchestrator.ts unchanged. */
export async function recordRuleAudit(
  organizationId: string,
  action: string,
  ruleId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await recordAuditEvent(organizationId, action, "Rule", ruleId, metadata);
}
