# Deterministic Engineering Rule Engine

## Purpose

The Rule Engine evaluates engineering rules against the canonical entity graph (`EngineeringEntity`/`EngineeringRelationship`) using **only deterministic logic**. It is deliberately **not** a reasoning or inference layer:

- It evaluates a rule's condition tree exactly as authored - no probabilistic scoring, no confidence thresholds on outcomes, no LLM calls.
- It never fabricates evidence. If a condition references data that doesn't exist on the subject entity, the missing field is recorded and the outcome becomes `INSUFFICIENT_EVIDENCE` - the engine never guesses a value or silently treats "missing" as "false."
- Every evaluation produces a fully reproducible trace: the same rule version evaluated against the same entity state always produces the same outcome.

Rules are the platform's first mechanism for expressing "what must be true" about engineering data, separate from both the canonical graph (what _is_ true, manually authored) and the ingestion pipeline (what a _document said_, staged and unconfirmed). The engine only ever compares these two existing sources against each other and against rule authors' explicit conditions - it does not resolve engineering truth automatically.

## Module Layout

```
src/server/rules/
├── constants.ts              # statuses, severities, categories, outcomes, operators
├── condition-types.ts        # RuleCondition discriminated union + Zod schemas
├── validation.ts             # Zod schemas for the API layer
├── validation-engine.ts      # duplicate/missing-ref/circular-dep/broken-condition checks
├── rule-service.ts           # CRUD, versioning, publish, dependency persistence
├── fragment-service.ts       # reusable condition fragment CRUD
├── index.ts                  # barrel export
└── engine/
    ├── types.ts               # SubjectEntity, EvaluationContext, TraceNode
    ├── evaluate-condition.ts  # pure condition-tree evaluator
    ├── evidence-resolution.ts # pure supporting/conflicting-evidence resolver
    ├── dependency-graph.ts    # pure cycle detection + topological sort
    └── orchestrator.ts        # the only DB-touching layer: executeRule/executeBatch
```

This mirrors `src/server/engineering/` and `src/server/ingestion/` exactly: same barrel-export convention, same `requireActiveOrganization()` + `getCurrentUser()` + `requirePermission()` pattern on every route, same Zod `safeParse` + `AppError` error handling, same mutable-row + immutable-version-snapshot pattern already established by `EngineeringEntity`/`EntityVersion`.

## Design Principle: No Fabrication

Every code path that could be tempted to "fill in" missing information instead surfaces the gap explicitly:

- A `comparison`/`exists` condition referencing an attribute absent from the subject (or a related entity) adds to `missingFields`, not to a false/failed result.
- `resolveEvidence()` only reports a conflict when **both** the canonical entity and a linked extraction have a value for the same key - a key present on one side and absent on the other is treated as "no data," not "conflict."
- A rule with an unmet dependency is marked `BLOCKED`, never silently skipped or assumed passing.
- The engine only performs comparisons and traversals explicitly present in the rule's condition tree - there is no implicit type coercion beyond what a comparison operator's Zod-validated value type already allows.

## Outcome Derivation

Every evaluation resolves to exactly one of five outcomes, in this precedence order:

1. **`BLOCKED`** - set before condition evaluation even runs, if any dependency rule's latest result for the same subject entity isn't `PASSED`.
2. **`INSUFFICIENT_EVIDENCE`** - the condition tree referenced at least one missing field.
3. **`NEEDS_REVIEW`** - the condition evaluated cleanly, but the subject's linked extraction records conflict with canonical data on at least one attribute.
4. **`PASSED`** / **`FAILED`** - the condition tree's boolean result, when there's no missing evidence and no conflict.

See `rule-execution.md` for how these are computed end-to-end and `rule-validation.md` for the checks applied before a rule is allowed to run at all.

## Known Limitations (by design, not oversights)

- **No visual drag-and-drop editor.** The condition tree is a clean JSON-serializable model with a form-based editor over it; a canvas-based editor can be layered on top later without any data-model change.
- **No cross-domain dependencies.** Rule dependencies and relationship checks operate against the engineering entity graph only - there is no notion yet of a rule depending on, e.g., a supplier compliance record in a different subsystem.
- **No distributed execution.** Batch execution runs in-process with a bounded concurrency pool (`RULE_EXECUTION_CONCURRENCY`), the same pattern as the ingestion queue runner. A durable/distributed executor can replace `engine/orchestrator.ts`'s internals later without any API or schema change.
- **Not load-tested against a live database.** No local PostgreSQL server is available in this development environment, so `orchestrator.ts` and the service layer are verified by type-checking and by unit-testing every pure function they call (`evaluate-condition.ts`, `evidence-resolution.ts`, `dependency-graph.ts`, `validation-engine.ts`) - not by running against real data at scale. This is the same gap called out in the ingestion pipeline's documentation.

## Related Documentation

- `rule-model.md` - the full data model (`Rule`, `RuleVersion`, `RuleFragment`, `RuleDependency`, `RuleExecutionResult`).
- `rule-library.md` - browsing, filtering, categories, tags, and reusable fragments.
- `rule-execution.md` - the execution engine: single/batch/dependency-aware/cached evaluation.
- `rule-api.md` - full API reference.
- `rule-validation.md` - validation checks and the publish gate.
