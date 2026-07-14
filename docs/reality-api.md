# Reality API

All endpoints require an active organization, an authenticated user, and the listed `reality:*`
permission. Errors follow the platform-wide shape: `{ error: string, code?: string, details?: unknown
}` with the matching HTTP status.

## `POST /api/reality/assessments`

Starts a new assessment for an already-completed Orchestration Run. Permission: `reality:execute`.

**Body:**

```json
{ "orchestrationRunId": "string (required)" }
```

Returns `400 ORCHESTRATION_RUN_NOT_COMPLETED` if the referenced run has not reached `COMPLETED`. Runs
synchronously within the request (the 8-stage pipeline only reads already-persisted data, so it is
bounded and fast) and returns the completed `RealityAssessment` row, including its final `outcome` and
`reasoning`. Status: `201`.

## `GET /api/reality/assessments`

Paginated, filterable assessment history. Permission: `reality:read`.

**Query params:** `page`, `pageSize` (max 100), `status`, `outcome`, `subjectEntityId`, `search`
(matches subject entity ID), `from`, `to` (ISO dates, filters `createdAt`).

**Response:** `{ data: RealityAssessment[], total, page, pageSize, totalPages }`.

## `GET /api/reality/assessments/:id`

Full assessment detail: outcome, reasoning, evidence/rule/contradiction/traceability summaries,
ingestion completeness, and timing. Permission: `reality:read`.

## `POST /api/reality/assessments/:id/cancel`

Requests cancellation of a still-running assessment, checked at the next stage boundary. Best-effort. A
`409 ALREADY_TERMINAL` error if the assessment has already reached a terminal state. Permission:
`reality:execute` for the assessment's own triggering user; `reality:manage` is the intended permission
for cancelling another user's assessment.

## `GET /api/reality/assessments/:id/logs`

Paginated `RealityStageLog` rows for one assessment, ordered by stage index then attempt. Permission:
`reality:read`. **Query params:** `page`, `pageSize`, `status`.

## `GET /api/reality/assessments/compare?ids=a,b`

Fetches 2-5 assessments by ID for side-by-side comparison - each is returned as its own independently
diffable record; the diff itself is computed by the caller (or the future comparison view), not by this
endpoint. Permission: `reality:read`.

## `GET /api/reality/pipeline/status`

Aggregate observability: in-flight assessment count, outcome distribution across completed assessments,
and per-stage average duration and failure rate computed from the organization's most recent 500 stage
log rows. Permission: `reality:read`.

**Response:**

```json
{
  "data": {
    "inFlightAssessments": 0,
    "outcomeDistribution": { "VERIFIED": 12, "NEEDS_REVIEW": 3 },
    "stages": [
      {
        "stageName": "LOAD_ENGINEERING_CONTEXT",
        "sampleSize": 15,
        "averageDurationMs": 8,
        "failureRate": 0
      }
    ]
  }
}
```
