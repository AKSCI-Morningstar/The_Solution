# Orchestration API

All endpoints require an active organization (`requireActiveOrganization()`), an authenticated user,
and the listed `orchestrator:*` permission. Errors follow the platform-wide shape:
`{ error: string, code?: string, details?: unknown }` with the matching HTTP status.

## `POST /api/orchestrator/runs`

Starts a new evaluation. Permission: `orchestrator:execute`.

**Body:**

```json
{
  "subjectEntityId": "string (required)",
  "requestedRuleIds": ["string", "..."],
  "maxDepth": 3
}
```

`requestedRuleIds` is optional - if omitted, every `ACTIVE` rule scoped to the subject's entity type is
auto-discovered and evaluated. `maxDepth` bounds relationship/evidence traversal (1-10, default 3).

Runs synchronously within the request (the pipeline is a bounded graph traversal, not a long-running
document-parsing job) and returns the completed `OrchestrationRun` row, including its final
`assessment`. Status: `201`.

## `GET /api/orchestrator/runs`

Paginated, filterable run history. Permission: `orchestrator:read`.

**Query params:** `page`, `pageSize` (max 100), `status`, `subjectEntityId`, `search` (matches subject
entity ID), `from`, `to` (ISO dates, filters `createdAt`).

**Response:** `{ data: OrchestrationRun[], total, page, pageSize, totalPages }`.

## `GET /api/orchestrator/runs/:id`

Full execution detail for one run: assessment, evidence/rule/contradiction/traceability summaries,
timing, and error info if failed. Permission: `orchestrator:read`.

## `POST /api/orchestrator/runs/:id/cancel`

Requests cancellation of a still-running run by setting `cancelRequested`, checked at the next stage
boundary. Best-effort, not a guarantee of immediate stop. A no-op error (`400`) if the run has already
reached a terminal state. Permission: `orchestrator:execute` for the run's own triggering user;
`orchestrator:manage` is the intended permission for cancelling another user's run (enforced the same
way `requirePermission` gates every other mutating action in this platform).

## `GET /api/orchestrator/runs/:id/logs`

Paginated `OrchestrationStageLog` rows for one run (every stage attempt, including retries), ordered by
stage index then attempt. Permission: `orchestrator:read`.

**Query params:** `page`, `pageSize`, `status`.

## `GET /api/orchestrator/pipeline/status`

Aggregate observability: current in-flight run count plus per-stage average duration and failure rate
computed from the organization's most recent 500 stage log rows. Permission: `orchestrator:read`.

**Response:**

```json
{
  "data": {
    "inFlightRuns": 0,
    "stages": [
      {
        "stageName": "VALIDATE_REQUEST",
        "sampleSize": 42,
        "averageDurationMs": 12,
        "failureRate": 0
      }
    ]
  }
}
```
