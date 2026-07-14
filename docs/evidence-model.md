# Evidence Model

The evidence model defines the data structures used by the Evidence Resolution Engine to represent, analyze, and resolve engineering evidence.

## Evidence Node

An `EvidenceNode` represents a unit of evidence in the evidence graph.

```typescript
interface EvidenceNode {
  id: string; // Unique node ID (e.g., "entity:abc123")
  type: EvidenceNodeType; // ENTITY, DOCUMENT, EXTRACTED_FACT, REQUIREMENT, etc.
  label: string; // Display name
  entityId?: string; // Linked engineering entity ID
  entityType?: string; // Entity type (COMPONENT, ASSEMBLY, etc.)
  status?: string; // Entity status (DRAFT, ACTIVE, APPROVED, etc.)
  version?: string; // Entity version
  documentId?: string; // Source document ID
  documentName?: string; // Source document filename
  documentVersion?: number; // Document version number
  page?: number; // Page number in source document
  section?: string; // Section in source document
  extractionMethod?: string; // Parser that extracted this evidence
  confidence?: number; // Extraction confidence (0-1)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

## Evidence Edge

An `EvidenceEdge` represents a relationship between evidence nodes.

```typescript
interface EvidenceEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: EvidenceRelationType; // SUPPORTS, CONTRADICTS, VERIFIES, etc.
  metadata?: Record<string, unknown>;
}
```

## Evidence Relation Types

| Relation       | Description                             |
| -------------- | --------------------------------------- |
| `SUPPORTS`     | Source evidence supports the target     |
| `CONTRADICTS`  | Source evidence contradicts the target  |
| `REFERENCES`   | Source references the target            |
| `DERIVES_FROM` | Source is derived from the target       |
| `VERIFIES`     | Source verifies the target              |
| `SUPERSEDES`   | Source supersedes the target (outdated) |
| `DUPLICATE_OF` | Source is a duplicate of the target     |
| `OUTDATED_BY`  | Source is outdated by the target        |

## Evidence Graph

The `EvidenceGraph` is the in-memory structure used for analysis.

```typescript
interface EvidenceGraph {
  nodes: Map<string, EvidenceNode>;
  edges: EvidenceEdge[];
  rootId: string;
}
```

The graph is built via BFS traversal from a root entity, following both outgoing and incoming relationships up to a configurable max depth.

## Evidence Node Type Mapping

Engineering entity types are mapped to evidence node types:

| Entity Type        | Evidence Node Type |
| ------------------ | ------------------ |
| REQUIREMENT        | REQUIREMENT        |
| SPECIFICATION      | SPECIFICATION      |
| TEST               | TEST               |
| STANDARD           | STANDARD           |
| CERTIFICATION      | CERTIFICATION      |
| SUPPLIER           | SUPPLIER           |
| MANUFACTURER       | SUPPLIER           |
| ENGINEERING_CHANGE | ENGINEERING_CHANGE |
| DOCUMENT_REFERENCE | DOCUMENT           |
| EVIDENCE_REFERENCE | EXTRACTED_FACT     |
| (other)            | ENTITY             |

## Relationship Type Mapping

Engineering relationship types are mapped to evidence relation types:

| Relationship Type | Evidence Relation |
| ----------------- | ----------------- |
| VERIFIES          | VERIFIES          |
| REFERENCES        | REFERENCES        |
| DERIVED_FROM      | DERIVES_FROM      |
| SUPERSEDES        | SUPERSEDES        |
| DEPENDS_ON        | SUPPORTS          |
| IMPLEMENTS        | SUPPORTS          |
| CONTAINS          | REFERENCES        |
| MANUFACTURED_BY   | SUPPORTS          |
| SUPPLIED_BY       | SUPPORTS          |
| TESTED_BY         | VERIFIES          |
| CERTIFIED_BY      | VERIFIES          |

## Document Evidence

In addition to entity-based evidence, the graph incorporates `ExtractedEntity` records from the ingestion pipeline. These represent facts extracted from uploaded documents and linked to canonical entities. Each extracted fact node carries:

- Document ID and filename
- Document version
- Page number
- Section
- Extraction method (parser name)
- Extraction confidence

This provides document provenance for the evidence chain.
