# Contradiction API

## Overview

All contradiction API routes are organization-scoped and require an authenticated session. Responses use the standard `NextResponse` JSON format.

## Endpoints

### GET `/api/contradictions`

List contradictions for the active organization with optional filters and summary.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| type | string | — | Filter by contradiction type |
| severity | string | — | Filter by severity |
| status | string | — | Filter by lifecycle status |
| entityId | string | — | Filter by entity ID |
| search | string | — | Search in label/description |
| sort | string | detectedAt | Sort field (detectedAt, severity, type, updatedAt) |
| order | asc\|desc | desc | Sort order |

**Response:**

```json
{
  "data": [ContradictionRecord],
  "pagination": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 },
  "summary": ContradictionSummary
}
```

### GET `/api/contradictions/[id]`

Get a single contradiction with full detail.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| include | string | Comma-separated: `evidence`, `traceability`, `affected`, `lifecycle` |

**Response:**

```json
{
  "data": ContradictionRecord,
  "evidence": ContradictionEvidence[],
  "traceability": ContradictionTraceabilityRecord[],
  "affected": AffectedEntity[],
  "lifecycle": ContradictionLifecycleEntry[]
}
```

### POST `/api/contradictions/detect`

Trigger contradiction detection for a specific entity.

**Request Body:**

```json
{
  "entityId": "string",
  "maxDepth": 5
}
```

**Response:**

```json
{
  "data": {
    "contradictions": [ContradictionRecord],
    "totalDetected": 3,
    "insufficientEvidenceCount": 1,
    "detectedAt": "2026-07-14T..."
  }
}
```

### PATCH `/api/contradictions/[id]`

Update a contradiction's lifecycle status.

**Request Body:**

```json
{
  "status": "UNDER_REVIEW",
  "resolutionNotes": "Reviewed and accepted as a real contradiction."
}
```

**Response:**

```json
{
  "data": ContradictionRecord
}
```

**Lifecycle Validation:**

The API validates transitions using `validateLifecycleTransition()`. Invalid transitions return a 400 error:

```json
{
  "error": "Cannot transition from ACCEPTED to UNDER_REVIEW"
}
```

## Types

All API types are defined in `src/server/contradictions/types.ts` and validated using Zod schemas in `src/server/contradictions/validation.ts`.

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid input or invalid lifecycle transition |
| 401 | Not authenticated |
| 403 | Not authorized for this organization |
| 404 | Contradiction not found |
| 500 | Internal server error |
