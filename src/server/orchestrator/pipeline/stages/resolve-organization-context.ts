import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 2 - the organization and actor are already resolved and permission-
 * checked by the API route before the pipeline starts (requireActiveOrganization
 * + requirePermission), the same as every other subsystem in this codebase.
 * This stage exists so that resolution is an explicit, logged step in the
 * execution timeline rather than an implicit precondition - it never
 * re-derives anything, only records what's already known into history.
 */
export const resolveOrganizationContextStage: WorkflowStage<PipelineContext> = {
  name: "RESOLVE_ORGANIZATION_CONTEXT",
  execute: async (ctx) => {
    return {
      patch: {},
      output: { organizationId: ctx.organizationId, triggeredById: ctx.triggeredById ?? null },
    };
  },
};
