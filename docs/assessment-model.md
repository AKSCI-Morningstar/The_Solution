# Reality Assessment Model

## Data model

- **`RealityAssessment`** - one row per assessment run: the source `orchestrationRunId`, final
  `outcome` and `reasoning`, per-subsystem summaries (`entitiesEvaluated`, `evidenceSummary`,
  `ruleSummary`, `contradictionSummary`, `traceabilitySummary`, `ingestionCompleteness`), timing, and
  terminal status. Never updated by application code once `COMPLETED`, `FAILED`, or `CANCELLED` -
  immutable, matching every other execution-history record in this platform.
- **`RealityStageLog`** - one row per stage attempt (retries produce multiple rows for the same
  `stageIndex`), mirroring `OrchestrationStageLog` exactly.

Both are organization-scoped and cascade-deleted with the organization. `RealityAssessment` also
cascade-deletes with its source `OrchestrationRun` - an assessment has no meaning independent of the
run it reinterprets.

## Every assessment produces

| Field              | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| Assessment ID      | `RealityAssessment.id`                                             |
| Organization       | `organizationId`                                                   |
| Timestamp          | `createdAt`, `startedAt`, `completedAt`                            |
| Entities evaluated | `entitiesEvaluated` (from the source run's resolved neighborhood)  |
| Evidence summary   | `evidenceSummary`                                                  |
| Contradictions     | `contradictionSummary` (id, current status, severity, open/closed) |
| Rules executed     | `ruleSummary` (re-read outcomes, not re-executed)                  |
| Missing evidence   | `evidenceSummary.missingEvidenceCount`                             |
| Assessment outcome | `outcome`                                                          |
| Traceability graph | `traceabilitySummary`                                              |
| Execution history  | `RealityStageLog` rows, one per stage attempt                      |

## Outcome derivation precedence

Implemented as a pure function (`src/server/reality/pipeline/stages/produce-reality-assessment.ts
#deriveRealityAssessment`), evaluated in this fixed order - the first matching condition wins:

1. **`INSUFFICIENT_EVIDENCE`** - the evidence summary shows missing evidence, or the source
   Orchestration Run itself was `INSUFFICIENT_EVIDENCE`. Nothing to reason about further.
2. **`INCOMPLETE`** - the Ingestion Pipeline has pending (`QUEUED`/`RUNNING`) or `FAILED` jobs for
   documents that produced evidence for entities in scope. The evidence base itself is not yet
   settled.
3. **`CONTRADICTED`** - at least one associated contradiction is still open (`DETECTED` or
   `UNDER_REVIEW`) as of right now, regardless of what its status was when the source run executed.
4. **`NEEDS_REVIEW`** - the source run's outcome was `NEEDS_REVIEW` or `BLOCKED`, or a re-read rule
   outcome is `NEEDS_REVIEW` or `BLOCKED`.
5. **`NEEDS_REVIEW`** - the source run's outcome was `FAILED`. A failed rule always requires human
   review before reality can be called verified; `CONTRADICTED` is reserved strictly for the
   Contradiction Engine's own findings so the two outcomes never overlap ambiguously.
6. **`CONDITIONALLY_VERIFIED`** - the source run was `PASSED`, no contradictions are open, and
   ingestion is complete, but conflicting evidence was recorded against the entity. Verified with a
   caveat, not an unconditional pass.
7. **`VERIFIED`** - the source run was `PASSED`, no contradictions are open, ingestion is complete, and
   no conflicting evidence was recorded. The only outcome level where reality is fully, unconditionally
   established.

This precedence is deterministic and total - every possible combination of signals maps to exactly one
outcome, and the same inputs always produce the same outcome.

## Determinism guarantees

- Stage 8 is a pure function of the context object built by stages 1-7 - no I/O, no randomness.
- Stages 1, 3, 4, 6 only read data the Orchestrator (or the Evidence/Rule/Traceability engines it
  called) already persisted - they never recompute it.
- Stages 5 and 7 read live state (current contradiction status, current ingestion job status) but never
  write, mutate, or re-trigger anything - they observe, they do not act.
- Replaying the same assessment (same source run, same present-day contradiction/ingestion state)
  always derives the same outcome.
