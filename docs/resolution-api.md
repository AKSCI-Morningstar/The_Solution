# Resolution API

The Evidence Resolution Engine exposes five API endpoints for evaluating evidence, retrieving chains, traceability, conflicts, and missing evidence.

All endpoints require an active organization (via the `morningstar_org` cookie) and a valid session.

## Endpoints

### POST /api/evidence/evaluate

Evaluates all evidence for a given entity and returns the full resolution result.

**Request Body:**

```json
{
  "entityId": "abc123",
  "maxDepth": 5
}
```

**Response (200):**

```json
{
  "data": {
    "status": "SUFFICIENT",
    "subjectId": "abc123",
    "subjectLabel": "Hydraulic Pump",
    "supportingEvidence": [...],
    "conflictingEvidence": [...],
    "missingEvidence": [...],
    "evidenceChains": [...],
    "traceabilityGraph": {...},
    "conflicts": [...],
    "qualityIndicators": {...},
    "summary": {...},
    "resolvedAt": "2026-07-14T..."
  }
}
```

**Resolution Statuses:** `VERIFIED`, `SUFFICIENT`, `INSUFFICIENT`, `CONFLICTING`, `INCOMPLETE`, `NEEDS_REVIEW`

---

### GET /api/evidence/chains

Retrieves evidence chains for a given entity.

**Query Parameters:**

- `entityId` (required): The entity ID to build chains for
- `maxDepth` (optional, default 5): Maximum traversal depth

**Response (200):**

```json
{
  "data": [
    {
      "rootId": "entity:abc123",
      "links": [
        {
          "nodeId": "entity:def456",
          "node": {...},
          "relationType": "SUPPORTS",
          "sourceReferences": [...],
          "depth": 0
        }
      ],
      "totalDepth": 1
    }
  ]
}
```

---

### GET /api/evidence/traceability

Retrieves the full traceability graph for a given entity.

**Query Parameters:**

- `entityId` (required): The entity ID
- `maxDepth` (optional, default 5): Maximum traversal depth

**Response (200):**

```json
{
  "data": {
    "rootEntityId": "abc123",
    "records": [
      {
        "entityId": "abc123",
        "entityName": "Hydraulic Pump",
        "entityType": "COMPONENT",
        "entityIdentifier": "PUMP-001",
        "entityVersion": "1.0.0",
        "entityStatus": "ACTIVE",
        "documentId": "doc-1",
        "documentName": "spec.pdf",
        "documentVersion": 2,
        "page": 5,
        "section": "3.1",
        "relationshipPath": [],
        "extractionMethod": "pdf-parser",
        "organizationId": "org-1",
        "timestamp": "2026-07-14T..."
      }
    ],
    "totalRecords": 1
  }
}
```

---

### GET /api/evidence/conflicts

Retrieves detected conflicts for a given entity's evidence graph.

**Query Parameters:**

- `entityId` (required): The entity ID
- `maxDepth` (optional, default 5): Maximum traversal depth
- `type` (optional): Filter by conflict type
- `severity` (optional): Filter by severity (`HIGH`, `MEDIUM`, `LOW`)

**Conflict Types:** `CONFLICTING_SPECIFICATION`, `CONFLICTING_REQUIREMENT`, `CONFLICTING_MATERIAL`, `CONFLICTING_SUPPLIER`, `CONFLICTING_STANDARD`, `OUTDATED_EVIDENCE`, `DUPLICATE_EVIDENCE`, `BROKEN_REFERENCE`

**Response (200):**

```json
{
  "data": [
    {
      "id": "conflict:OUTDATED_EVIDENCE:...",
      "type": "OUTDATED_EVIDENCE",
      "label": "Old Spec is superseded by New Spec",
      "description": "...",
      "nodeIds": ["..."],
      "severity": "HIGH",
      "detectedAt": "2026-07-14T..."
    }
  ]
}
```

---

### GET /api/evidence/missing

Retrieves missing evidence items for a given entity.

**Query Parameters:**

- `entityId` (required): The entity ID
- `maxDepth` (optional, default 5): Maximum traversal depth
- `type` (optional): Filter by missing evidence type
- `severity` (optional): Filter by severity

**Missing Evidence Types:** `MISSING_TEST`, `MISSING_CERTIFICATION`, `MISSING_SPECIFICATION`, `MISSING_TRACEABILITY`, `MISSING_APPROVAL`, `MISSING_REFERENCE`

**Response (200):**

```json
{
  "data": [
    {
      "id": "missing:MISSING_TEST:...",
      "type": "MISSING_TEST",
      "label": "No tests verify \"Hydraulic Pump\"",
      "description": "...",
      "severity": "HIGH"
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

| Status | Code             | Cause                                   |
| ------ | ---------------- | --------------------------------------- |
| 400    | VALIDATION_ERROR | Invalid input parameters                |
| 401    | UNAUTHORIZED     | No active session                       |
| 403    | FORBIDDEN        | No active organization or access denied |
| 500    | INTERNAL_ERROR   | Unexpected server error                 |
