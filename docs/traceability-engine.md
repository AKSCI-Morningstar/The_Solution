# Traceability Engine

The Traceability Engine produces complete traceability records for every entity in the evidence graph. It ensures that every conclusion can be traced back to its source documents, page references, entity versions, and relationship paths.

## Traceability Record

Each record captures the full provenance of a single entity in the evidence graph:

```typescript
interface TraceabilityRecord {
  entityId: string;           // The engineering entity ID
  entityName: string;         // Entity display name
  entityType: string;          // Entity type (COMPONENT, REQUIREMENT, etc.)
  entityIdentifier: string;    // Entity identifier (e.g., "PUMP-001")
  entityVersion: string;       // Entity version string
  entityStatus: string;        // Entity lifecycle status
  documentId?: string;         // Source document ID (if linked)
  documentName?: string;        // Source document filename
  documentVersion?: number;     // Document version
  page?: number;                // Page number in source document
  section?: string;             // Section in source document
  relationshipPath: string[];  // Path from root to this entity
  extractionMethod?: string;    // Parser that extracted the evidence
  organizationId: string;       // Owning organization
  timestamp: string;            // ISO timestamp of last update
}
```

## Traceability Graph

```typescript
interface TraceabilityGraph {
  rootEntityId: string;
  records: TraceabilityRecord[];
  totalRecords: number;
}
```

## How It Works

1. **BFS Traversal**: Starting from the root entity, the engine traverses both outgoing and incoming relationships up to `maxDepth` levels.

2. **Path Tracking**: For each entity visited, the engine records the full relationship path from the root. For example: `["VERIFIES->Test A", "REFERENCES->Spec B"]` means the root verifies Test A, which references Spec B.

3. **Document Provenance**: For each entity, the engine queries `ExtractedEntity` records to find linked document evidence. If found, the record includes document ID, filename, version, page, section, and extraction method.

4. **Complete Records**: Even entities without document references produce a traceability record with the relationship path and entity metadata.

## Preserved Information

Every traceability record preserves:

| Field | Source |
|-------|--------|
| Document | `IngestionDocument.fileName` |
| Page | `ExtractedEntity.page` |
| Section | `ExtractedEntity.section` |
| Version | `EngineeringEntity.version` / `IngestionDocument.currentVersion` |
| Entity | `EngineeringEntity.name`, `.identifier`, `.entityType` |
| Organization | Request context (organization ID) |
| Timestamp | `EngineeringEntity.updatedAt` |

## Relationship Path Format

The path is an array of strings, each describing one hop:

- Outgoing: `"RELATIONSHIP_TYPE->Target Name"` (e.g., `"VERIFIES->Stress Test"`)
- Incoming: `"Source Name->RELATIONSHIP_TYPE"` (e.g., `"Spec A->REFERENCES"`)

This format allows reconstructing the full evidence chain from root to any entity.

## Performance

- BFS with visited set prevents redundant queries
- Document evidence is batched per entity
- Max depth parameter limits traversal scope
- All queries are scoped to the organization for multi-tenant isolation
