import type { ExtractedEntityDraft, ExtractedRelationshipDraft, GraphPreview } from "../types";

/**
 * Shapes extracted entities/relationships into a lightweight preview graph
 * for the UI. This is explicitly NOT written into GraphNodeIndex/
 * GraphEdgeIndex - those back the canonical, confirmed knowledge graph only.
 */
export function prepareGraphPreview(
  entities: ExtractedEntityDraft[],
  relationships: ExtractedRelationshipDraft[],
): GraphPreview {
  return {
    nodes: entities.map((entity) => ({
      localId: entity.localId,
      entityType: entity.entityType,
      label: entity.name,
    })),
    edges: relationships.map((relationship) => ({
      relationshipType: relationship.relationshipType,
      sourceLocalId: relationship.sourceLocalId,
      targetLocalId: relationship.targetLocalId,
    })),
  };
}
