# Execution History

## Model

Every orchestration run persists two immutable records:

- **`OrchestrationRun`** - one row per run: inputs, final assessment, per-subsystem output summaries
  (evidence, rule results, contradictions, traceability), timing, and terminal status. Never updated by
  application code once `COMPLETED`, `FAILED`, or `CANCELLED` - the same immutability guarantee already
  established for `RuleExecutionResult`.
- **`OrchestrationStageLog`** - one row per stage _attempt_. A stage retried twice produces two rows for
  the same `stageIndex` with incrementing `attempt`, so the full retry history is preserved, not just
  the final outcome.

Both are organization-scoped and cascade-deleted with the organization, consistent with every other
entity in this platform.

## Replay

A run's `inputs` (subject entity ID, requested rule IDs, max depth) are recorded verbatim. Re-submitting
the same inputs via `POST /api/orchestrator/runs` re-executes the full pipeline and produces a new,
independent `OrchestrationRun` - the Orchestrator does not mutate or re-use a prior run's record. Because
every stage in the pipeline is deterministic (Section "Determinism guarantees" in
`engineering-reasoning-orchestrator.md`), replaying the same inputs against unchanged underlying data
(entities, rules, evidence) reproduces the same assessment.

## Comparison

Two runs for the same `subjectEntityId` can be compared by fetching both via `GET
/api/orchestrator/runs/:id` and diffing their `assessment`, `evidenceSummary`, `ruleResultIds`, and
`contradictionIds` - the API intentionally returns these as separate, independently-diffable fields
rather than one opaque blob, so a client (or a future dedicated comparison view) can highlight exactly
what changed between two evaluations of the same entity over time.

## Audit trail

Every lifecycle transition writes to the shared, organization-scoped `AuditLog` via
`recordAuditEvent()` (`src/server/audit/`):

| Action                    | When                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| `ORCHESTRATION_STARTED`   | Run transitions to `RUNNING`                                        |
| `ORCHESTRATION_COMPLETED` | Run reaches `COMPLETED`, includes the final outcome                 |
| `ORCHESTRATION_FAILED`    | Run reaches `FAILED`, includes the failing stage and message        |
| `ORCHESTRATION_CANCELLED` | Run reaches `CANCELLED`, includes the stage it was cancelled before |

`ORCHESTRATION_STAGE_RETRIED` is reserved in the audit-action vocabulary for a future per-retry audit
entry; today retries are fully captured in `OrchestrationStageLog` (one row per attempt), which is the
canonical source for stage-level history.

## Filtering, search, and pagination

`GET /api/orchestrator/runs` supports filtering by `status`, `subjectEntityId`, a `search` term matched
against the subject entity ID, and a `createdAt` date range (`from`/`to`), with standard
`page`/`pageSize` pagination (max 100 per page). `GET /api/orchestrator/runs/:id/logs` supports the same
pagination plus a `status` filter, for runs with a large number of stage attempts.

## Notifications

On any terminal state (`COMPLETED`, `FAILED`, `CANCELLED`), the triggering user (if any) receives an
in-app `Notification` (`src/server/notifications/`) linking back to `/orchestrator/:runId` - visible in
the Notification Workspace and via `GET /api/notifications`.
