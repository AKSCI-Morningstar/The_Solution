import { prisma } from "@/server/db";
import { getNodeNeighbors } from "@/server/knowledge-graph";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 4 - retrieves the subject entity's relationships from the Knowledge
 * Graph's materialized index (GraphNodeIndex/GraphEdgeIndex), which is kept
 * in sync with the canonical graph via `syncGraphIndexes()` but is a
 * separate, secondary view - not the same data path Evidence Resolution
 * uses in stage 5 (which traverses EngineeringRelationship directly). If the
 * index hasn't been synced for this entity yet, that's reported as zero
 * graph relationships, not a failure - the index is a materialized
 * convenience view, and its absence doesn't block canonical evidence
 * resolution downstream.
 */
export const retrieveGraphRelationshipsStage: WorkflowStage<PipelineContext> = {
  name: "RETRIEVE_GRAPH_RELATIONSHIPS",
  execute: async (ctx) => {
    const node = await prisma.graphNodeIndex.findFirst({
      where: { entityId: ctx.subjectEntityId, organizationId: ctx.organizationId },
      select: { id: true },
    });

    if (!node) {
      return {
        patch: { graphNodeFound: false, graphRelationshipCount: 0 },
        output: { graphNodeFound: false, relationshipCount: 0 },
      };
    }

    const { outgoing, incoming } = await getNodeNeighbors(node.id, ctx.organizationId);
    const relationshipCount = outgoing.length + incoming.length;

    return {
      patch: { graphNodeFound: true, graphRelationshipCount: relationshipCount },
      output: { graphNodeFound: true, relationshipCount },
    };
  },
};
