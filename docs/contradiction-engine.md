# Contradiction Engine

## Overview

The Deterministic Contradiction Engine detects, classifies, explains, and traces engineering contradictions using deterministic logic. It operates on the in-memory Evidence Graph built by the Evidence Resolution Engine and produces fully traceable contradiction records with lifecycle management.

**Core Principles:**

- **Deterministic**: Same input always produces same output. No probabilistic or AI-driven inference.
- **Traceable**: Every contradiction includes a full provenance chain back to source documents.
- **Explainable**: Every contradiction includes a human-readable explanation of why it was flagged.
- **Never Auto-Resolves**: The engine detects and classifies contradictions but never resolves them. Resolution is always a human decision.

## Architecture

```
Evidence Graph (from Evidence Resolution Engine)
    │
    ▼
Contradiction Detection Engine (14 detection functions)
    │
    ▼
Contradiction Records (typed, classified, traceable)
    │
    ▼
Contradiction Service (persistence, lifecycle, CRUD)
    │
    ▼
API Routes → UI Workspace
```

## Detection Pipeline

The `detectContradictions(graph, organizationId)` function runs 14 detection functions in sequence against the Evidence Graph:

| #   | Function                            | Contradiction Type          | Severity      |
| --- | ----------------------------------- | --------------------------- | ------------- |
| 1   | `detectRequirementContradictions`   | REQUIREMENT_CONTRADICTION   | CRITICAL/HIGH |
| 2   | `detectSpecificationContradictions` | SPECIFICATION_CONTRADICTION | HIGH          |
| 3   | `detectMaterialContradictions`      | MATERIAL_CONTRADICTION      | HIGH          |
| 4   | `detectSupplierContradictions`      | SUPPLIER_CONTRADICTION      | MEDIUM        |
| 5   | `detectInterfaceContradictions`     | INTERFACE_CONTRADICTION     | HIGH          |
| 6   | `detectVersionContradictions`       | VERSION_CONTRADICTION       | HIGH          |
| 7   | `detectLifecycleContradictions`     | LIFECYCLE_CONTRADICTION     | MEDIUM        |
| 8   | `detectRelationshipContradictions`  | RELATIONSHIP_CONTRADICTION  | HIGH          |
| 9   | `detectCertificationContradictions` | CERTIFICATION_CONTRADICTION | HIGH          |
| 10  | `detectDocumentContradictions`      | DOCUMENT_CONTRADICTION      | MEDIUM        |
| 11  | `detectEvidenceContradictions`      | EVIDENCE_CONTRADICTION      | CRITICAL      |
| 12  | `detectStaleEvidence`               | EVIDENCE_CONTRADICTION      | MEDIUM        |
| 13  | `detectBrokenReferences`            | RELATIONSHIP_CONTRADICTION  | HIGH          |
| 14  | `detectDuplicateEntities`           | EVIDENCE_CONTRADICTION      | MEDIUM        |

Each function uses a shared `seen` set to deduplicate contradictions across detection passes.

## Key Design Decisions

1. **In-memory detection**: Detection runs entirely on the Evidence Graph in memory. No database queries during detection.
2. **Deduplication**: Contradiction IDs are deterministic (`contradiction:<type>:<sorted-ids>`), preventing duplicates across runs.
3. **Classification at detection time**: Each detection function assigns the type, severity, and description inline.
4. **Traceability built-in**: Every contradiction record includes `traceabilityChain` and `affectedEntities` arrays.
5. **Lifecycle separated from detection**: Detection only creates records with status `DETECTED`. Lifecycle transitions are managed by the service layer.

## Integration with Evidence Engine

The Contradiction Engine reuses the Evidence Resolution Engine's types:

- `EvidenceGraph` — the in-memory graph structure
- `EvidenceNode` — nodes representing entities, documents, extracted facts
- `EvidenceEdge` — typed relationships between nodes

The `buildEvidenceGraph()` function from the evidence module constructs the graph from Prisma entities, relationships, and extracted document facts. The contradiction engine then operates on this graph without modifying it.

## File Structure

```
src/server/contradictions/
├── constants.ts           # 12 types, 7 severities, 6 statuses, lifecycle transitions
├── types.ts               # ContradictionRecord, ContradictionEvidence, etc.
├── validation.ts          # Zod schemas, lifecycle transition validator
├── detection-engine.ts    # 14 detection functions + detectContradictions()
├── contradiction-service.ts  # CRUD, lifecycle, summary
└── index.ts               # Barrel exports
```
