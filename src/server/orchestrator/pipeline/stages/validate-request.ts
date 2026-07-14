import { getEntity } from "@/server/engineering";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/** Stage 1 - confirms the subject entity actually exists in this organization before anything else runs. Throws NotFoundError (a genuine validation failure) if not - this is distinct from "insufficient evidence", which only applies once the entity is confirmed to exist but lacks supporting evidence. */
export const validateRequestStage: WorkflowStage<PipelineContext> = {
  name: "VALIDATE_REQUEST",
  execute: async (ctx) => {
    const entity = await getEntity(ctx.subjectEntityId, ctx.organizationId);
    return {
      patch: {
        subjectEntity: {
          id: entity.id,
          entityType: entity.entityType,
          identifier: entity.identifier,
          name: entity.name,
          status: entity.status,
        },
      },
      output: { entityId: entity.id, entityType: entity.entityType, identifier: entity.identifier },
    };
  },
};
