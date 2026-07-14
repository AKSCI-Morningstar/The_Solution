# Contradiction Model

## Contradiction Record

Every detected contradiction is represented as a `ContradictionRecord`:

```typescript
interface ContradictionRecord {
  id: string;                    // Deterministic ID: contradiction:<type>:<sorted-ids>
  organizationId: string;        // Organization scope
  type: ContradictionType;       // One of 12 contradiction types
  severity: ContradictionSeverity; // One of 7 severity levels
  status: ContradictionStatus;   // Lifecycle status (starts at DETECTED)
  label: string;                 // Human-readable label
  description: string;           // Full explanation of why the contradiction exists
  sourceEntityIds: string[];     // Entity IDs involved
  sourceDocumentIds: string[];   // Document IDs involved
  supportingEvidence: ContradictionEvidence[];   // Evidence supporting the claim
  conflictingEvidence: ContradictionEvidence[];   // Evidence that conflicts
  traceabilityChain: ContradictionTraceabilityRecord[]; // Provenance chain
  affectedEntities: AffectedEntity[];             // Entities impacted
  detectedAt: string;            // ISO timestamp
  resolvedAt?: string;           // Set when status becomes RESOLVED
  resolutionNotes?: string;      // Human-provided resolution explanation
  detectedById?: string;         // User who triggered detection
  resolvedById?: string;         // User who resolved
}
```

## 12 Contradiction Types

| Type | Description |
|------|-------------|
| REQUIREMENT_CONTRADICTION | Two or more requirements cannot simultaneously be satisfied |
| SPECIFICATION_CONTRADICTION | Conflicting specifications reference the same object with incompatible parameters |
| DOCUMENT_CONTRADICTION | Document content contains internally inconsistent statements |
| EVIDENCE_CONTRADICTION | Evidence nodes present conflicting claims about the same fact |
| MATERIAL_CONTRADICTION | Material specifications conflict for the same component |
| SUPPLIER_CONTRADICTION | Multiple suppliers with incompatible capabilities assigned to same entity |
| INTERFACE_CONTRADICTION | Interface definitions between connected components are incompatible |
| VERSION_CONTRADICTION | Version mismatches exist between related engineering objects |
| LIFECYCLE_CONTRADICTION | Lifecycle status conflicts between related entities |
| RELATIONSHIP_CONTRADICTION | Relationship definitions conflict or create impossible dependency cycles |
| CERTIFICATION_CONTRADICTION | Certification requirements conflict for the same entity |
| RULE_VIOLATION | An engineering rule or constraint has been violated |

## 7 Severity Levels

| Severity | Usage |
|----------|-------|
| CRITICAL | Direct contradictions that make the evidence set unusable |
| HIGH | Conflicting evidence that requires immediate review |
| MEDIUM | Potential conflicts that need investigation |
| LOW | Minor inconsistencies with limited impact |
| INFORMATION_ONLY | Noted for awareness, no action required |
| BLOCKED_BY_MISSING_EVIDENCE | Cannot determine if contradiction exists due to missing evidence |
| NEEDS_REVIEW | Requires human judgment to classify |

## 6 Lifecycle Statuses

```
DETECTED → UNDER_REVIEW → ACCEPTED → RESOLVED → ARCHIVED
                    ↘         ↘
                  REJECTED → ARCHIVED
```

### Valid Transitions

| From | To |
|------|-----|
| DETECTED | UNDER_REVIEW, ACCEPTED, REJECTED, ARCHIVED |
| UNDER_REVIEW | ACCEPTED, REJECTED, DETECTED |
| ACCEPTED | RESOLVED, ARCHIVED |
| REJECTED | ARCHIVED, DETECTED |
| RESOLVED | ARCHIVED, DETECTED |
| ARCHIVED | DETECTED |

Any contradiction can be reopened from ARCHIVED back to DETECTED.

## Contradiction Evidence

Each contradiction record captures the evidence nodes involved:

```typescript
interface ContradictionEvidence {
  nodeId: string;
  label: string;
  entityType?: string;
  status?: string;
  version?: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  extractionMethod?: string;
  createdAt: string;
  updatedAt: string;
}
```

Evidence nodes with status `ACTIVE` or `APPROVED` are classified as `supportingEvidence`. All others are classified as `conflictingEvidence`.

## Traceability Record

Every contradiction includes a full traceability chain:

```typescript
interface ContradictionTraceabilityRecord {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  entityVersion: string;
  entityStatus: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  relationshipPath: string[];    // Edge types traversed
  extractionMethod?: string;
  timestamp: string;
}
```

## Affected Entity

```typescript
interface AffectedEntity {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  relationship: string;    // How the entity is related to the contradiction
}
```

## Lifecycle Audit Log

Every lifecycle transition is recorded:

```typescript
interface ContradictionLifecycleEntry {
  id: string;
  contradictionId: string;
  action: ContradictionLifecycleAction;  // DETECTED, REVIEW_STARTED, ACCEPTED, REJECTED, RESOLVED, ARCHIVED, REOPENED
  fromStatus: string | null;
  toStatus: string;
  metadata?: Record<string, unknown>;
  performedById?: string;
  createdAt: string;
}
```

## Summary

```typescript
interface ContradictionSummary {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalCount: number;
  unresolvedCount: number;
}
```
