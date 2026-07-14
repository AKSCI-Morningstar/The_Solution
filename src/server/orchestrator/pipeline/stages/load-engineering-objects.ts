import { getEntity } from "@/server/engineering";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/** Stage 3 - loads the subject entity's directly-related engineering objects (its immediate relationship neighborhood), giving later stages a concrete object set to reason over. */
export const loadEngineeringObjectsStage: WorkflowStage<PipelineContext> = {
  name: "LOAD_ENGINEERING_OBJECTS",
  execute: async (ctx) => {
    const entity = await getEntity(ctx.subjectEntityId, ctx.organizationId);

    const relatedIds = new Set<string>();
    for (const rel of entity.sourceRelationships) relatedIds.add(rel.targetEntity.id);
    for (const rel of entity.targetRelationships) relatedIds.add(rel.sourceEntity.id);

    const loadedEntityIds = [entity.id, ...Array.from(relatedIds)];

    return {
      patch: { loadedEntityIds },
      output: { loadedCount: loadedEntityIds.length },
    };
  },
};
