# Engineering Reality Engine

## Overview

The Engineering Reality Engine determines Engineering Reality - the current verifiable state of an
engineering system - using only deterministic reasoning. It is **not** a generative AI system, an LLM
orchestration layer, or a probabilistic reasoning engine, and it must not be confused with the
**Engineering Reasoning Orchestrator**: the Orchestrator coordinates the reasoning engines and produces
a five-way deterministic assessment (`PASSED | FAILED | NEEDS_REVIEW | BLOCKED |
INSUFFICIENT_EVIDENCE`) for one point-in-time evaluation; the Reality Engine consumes an
already-completed Orchestration Run and reinterprets it - checking whether anything material has
changed since - into a six-way Engineering Reality judgment.

## What "consumes" means here

The mission for this engine lists the systems it consumes: the Knowledge Graph, Ingestion Pipeline,
Evidence Resolution Engine, Contradiction Engine, Rule Engine, Requirements Traceability, and the
Engineering Reasoning Orchestrator. The Reality Engine deliberately does **not** re-run the Rule Engine
or the Contradiction Engine a second time - doing so could produce a different result than what the
Orchestrator already recorded (for example if the subject entity changed in the meantime), which would
break traceability back to one immutable source of truth. Instead:

- **Rule Engine, Evidence Resolution, Requirements Traceability** - their outputs are read directly
  from the source `OrchestrationRun` row (persisted `ruleResultIds`, `evidenceSummary`,
  `traceabilitySummary`). Consumed, not recomputed.
- **Contradiction Engine** - its detected contradictions are read by ID from the source run, but their
  **current** lifecycle status is re-checked (a human may have resolved, accepted, or reopened a
  contradiction since the run completed). This is the one signal genuinely re-evaluated, not just read.
- **Knowledge Graph** - the entity set in scope (`entitiesEvaluated`) is read from the source run's
  already-resolved relationship neighborhood.
- **Ingestion Pipeline** - queried fresh: whether every source document that contributed evidence for
  the entities in scope has finished processing (no `QUEUED`/`RUNNING`/`FAILED` `IngestionJob` rows).
  This is the Reality Engine's one genuinely new integration point the Orchestrator does not check.
- **Engineering Reasoning Orchestrator** - the Reality Engine reuses the Orchestrator's generic
  `workflow-engine.ts` directly (`runWorkflow()`, `WorkflowStage`, `StageEvent`, cancellation, retry,
  timeout) rather than building a second workflow engine - a deliberate, direct dependency, not a
  parallel reimplementation.

## Engineering Reality

Engineering Reality represents the current verifiable state of an engineering system. Every conclusion
is evidence-backed, traceable back to the source Orchestration Run, reproducible (given the same run
and the same present-day contradiction/ingestion state, the same outcome is always derived), and
auditable. If reality cannot be established, the outcome is exactly `INSUFFICIENT_EVIDENCE` - never an
invented or inferred conclusion.

## The 8-stage assessment pipeline

Fixed, deterministic order (`src/server/reality/constants.ts#REALITY_STAGE_NAMES`):

1. **LOAD_ENGINEERING_CONTEXT** - loads the source `OrchestrationRun`; fails validation if it is not
   `COMPLETED`.
2. **RESOLVE_DEPENDENCIES** - reads the run's already-resolved entity neighborhood.
3. **GATHER_EVIDENCE** - reads the run's evidence summary.
4. **EXECUTE_RULE_EVALUATIONS** - reads the run's persisted rule outcomes (never re-executes rules).
5. **EVALUATE_CONTRADICTIONS** - re-reads each associated contradiction's **current** status.
6. **EVALUATE_TRACEABILITY** - reads the run's traceability record count.
7. **ASSESS_EVIDENCE_COMPLETENESS** - checks Ingestion Pipeline completeness for in-scope documents.
8. **PRODUCE_REALITY_ASSESSMENT** - pure function; derives the final outcome via fixed precedence, no
   I/O.

Unlike the Orchestrator's pipeline, no stage here is condition-gated for skipping - every stage is a
cheap read of already-computed data (not an expensive re-execution), so all 8 always run.

## Assessment outcomes

`VERIFIED | CONDITIONALLY_VERIFIED | CONTRADICTED | INCOMPLETE | NEEDS_REVIEW |
INSUFFICIENT_EVIDENCE` - see `assessment-model.md` for the full derivation precedence.

## Module layout

```
src/server/reality/
  constants.ts            stage names, statuses, outcome vocabulary, retry/timeout defaults
  types.ts                 RealityPipelineContext, RealityAssessmentResult
  validation.ts             Zod schemas
  run-service.ts            start/list/get/cancel/compare/pipeline-status
  pipeline/
    orchestrator.ts          wires the 8 stages into the Orchestrator's runWorkflow(), persists history
    stages/                  one file per stage
```
