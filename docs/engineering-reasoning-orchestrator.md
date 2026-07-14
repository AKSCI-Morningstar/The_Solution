# Engineering Reasoning Orchestrator

## Overview

The Engineering Reasoning Orchestrator coordinates the platform's independent deterministic reasoning
systems into one repeatable, auditable engineering evaluation per run. It performs no reasoning of its
own - it sequences calls into existing engines and aggregates their outputs into a single deterministic
assessment.

It is **not** a generative AI system, an LLM orchestration layer, or a probabilistic reasoning engine.
Every conclusion it produces is derived from a fixed precedence rule applied to the outputs of the
engines it coordinates - never invented, never guessed.

## Systems coordinated

- **Engineering Knowledge Graph** (`@/server/knowledge-graph`) - relationship retrieval via the
  materialized `GraphNodeIndex`/`GraphEdgeIndex`.
- **Evidence Resolution Engine** (`@/server/evidence`) - evidence graph construction, conflict
  detection, missing-evidence detection, and Requirements Traceability (`buildTraceabilityGraph`) -
  there is no separate "Requirements Traceability Platform" module; it is an Evidence Engine capability.
- **Rule Engine** (`@/server/rules`) - deterministic rule evaluation against the subject entity.
- **Contradiction Engine** (`@/server/contradictions`) - contradiction detection and persistence.
- **Engineering domain** (`@/server/engineering`) - subject entity resolution.
- **RBAC / Organizations** - every run is scoped to one organization and gated by the `orchestrator`
  permission resource (`read`, `execute`, `manage`).
- **Audit System** (`@/server/audit`) - every lifecycle transition is recorded to the shared,
  organization-scoped `AuditLog`.
- **Notification Framework** (`@/server/notifications`) - the triggering user is notified when a run
  reaches a terminal state.

## The 10-stage pipeline

Fixed, deterministic order (`src/server/orchestrator/constants.ts#STAGE_NAMES`):

1. **VALIDATE_REQUEST** - confirms the subject entity exists in the organization.
2. **RESOLVE_ORGANIZATION_CONTEXT** - records the already-resolved org/user into the execution
   timeline (resolution itself happens at the API layer via `requireActiveOrganization`/
   `requirePermission` before the pipeline starts).
3. **LOAD_ENGINEERING_OBJECTS** - loads the subject entity and its immediate relationship
   neighborhood.
4. **RETRIEVE_GRAPH_RELATIONSHIPS** - reads the Knowledge Graph's materialized neighbor index.
5. **RESOLVE_SUPPORTING_EVIDENCE** - builds the evidence graph, detects conflicts and missing
   evidence. Determines whether the run can proceed at all.
6. **EXECUTE_RULE_ENGINE** - evaluates the subject against requested (or auto-discovered ACTIVE)
   rules.
7. **EXECUTE_CONTRADICTION_ENGINE** - detects and persists contradictions.
8. **EVALUATE_TRACEABILITY** - builds the Requirements Traceability graph.
9. **AGGREGATE_RESULTS** - pure function; combines stages 5-8 into one tally, no I/O.
10. **PRODUCE_ASSESSMENT** - pure function; derives the final outcome from the aggregate via fixed
    precedence, no I/O.

Stages 6, 7, and 8 are **condition-gated** on stage 5 having found at least one supporting evidence
node. With none, there is nothing for the Rule Engine, Contradiction Engine, or Traceability builder to
reason over - they are skipped (logged as `SKIPPED`, not `FAILED`), and the aggregate/assessment stages
naturally derive `INSUFFICIENT_EVIDENCE` from stage 5's missing-evidence findings.

## Insufficient Evidence

If reality cannot be established - no supporting evidence, or required evidence items are missing -
the assessment outcome is exactly `INSUFFICIENT_EVIDENCE`. The Orchestrator never fills the gap with an
inferred or generated conclusion.

## Assessment outcomes

Reused verbatim from the Rule Engine's five-outcome vocabulary
(`src/server/orchestrator/constants.ts#ASSESSMENT_OUTCOMES`):

`PASSED | FAILED | NEEDS_REVIEW | BLOCKED | INSUFFICIENT_EVIDENCE`

Derivation precedence (`src/server/orchestrator/pipeline/stages/produce-assessment.ts`):

1. Missing evidence &rarr; `INSUFFICIENT_EVIDENCE`
2. Open contradictions &rarr; `NEEDS_REVIEW`
3. Any rule outcome `BLOCKED` &rarr; `BLOCKED`
4. Any rule outcome `FAILED` &rarr; `FAILED`
5. Otherwise &rarr; `PASSED`

## Determinism guarantees

- Every stage is a thin, side-effect-transparent adapter over an existing engine's public function -
  no new reasoning logic is introduced.
- Stages 9 and 10 are pure functions of the context object - the same inputs always produce the same
  aggregate and the same assessment.
- Every run persists its full inputs, per-stage timeline, and final assessment immutably
  (`OrchestrationRun`, `OrchestrationStageLog`) - a run can be inspected or replayed against the same
  recorded inputs at any time.
- No step in the pipeline calls a generative model, samples randomly, or infers unobserved facts.

## Known, documented overlaps (not defects)

- Stage 4 reads the Knowledge Graph's materialized index, which is a secondary, eventually-synced view
  separate from the canonical `EngineeringRelationship` graph stage 5 traverses directly. If the index
  hasn't been synced for an entity, stage 4 reports zero relationships rather than failing.
- Stage 7 (`detectAndStoreContradictions`) rebuilds its own evidence graph internally rather than
  reusing stage 5's - a known redundancy between two independently-built engines, not a pipeline defect.

## Module layout

```
src/server/orchestrator/
  constants.ts           stage names, run/stage statuses, outcome vocabulary, retry/timeout defaults
  types.ts                PipelineContext, AggregateResult, EngineeringAssessment
  validation.ts           Zod schemas
  workflow-engine.ts       generic, domain-agnostic sequential engine (see workflow-engine.md)
  run-service.ts           start/list/get/cancel/pipeline-status
  pipeline/
    orchestrator.ts        wires the 10 stages into runWorkflow(), persists history, audits, notifies
    stages/                one file per stage
```
