export {
  ENTITY_TYPES,
  ENTITY_STATUSES,
  RELATIONSHIP_TYPES,
  AUDIT_ACTIONS,
  LIFECYCLE_TRANSITIONS,
  ENTITY_TYPE_LABELS,
  RELATIONSHIP_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  ENTITY_TYPE_COLORS,
} from "./constants";

export type { EntityType, EntityStatus, RelationshipType, AuditAction } from "./constants";

export {
  createEntitySchema,
  updateEntitySchema,
  changeEntityStatusSchema,
  createRelationshipSchema,
  entityFilterSchema,
  relationshipFilterSchema,
  validateLifecycleTransition,
} from "./validation";

export type {
  CreateEntityInput,
  UpdateEntityInput,
  ChangeEntityStatusInput,
  CreateRelationshipInput,
  EntityFilterInput,
  RelationshipFilterInput,
} from "./validation";

export {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  changeEntityStatus,
} from "./entity-service";

export {
  createRelationship,
  listRelationships,
  deleteRelationship,
  getEntityRelationships,
} from "./relationship-service";

export { createVersion, listVersions, getVersion, restoreVersion } from "./version-service";

export { recordAudit, listEntityAuditLogs } from "./audit-service";
