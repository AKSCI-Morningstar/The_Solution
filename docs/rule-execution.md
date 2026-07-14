# Rule Execution Model

## The Condition DSL

`RuleCondition` (`src/server/rules/condition-types.ts`) is a JSON-serializable discriminated union - no function bodies, no arbitrary code, so a future visual editor can read/write it directly:

| Type                | Meaning                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comparison`        | `field <operator> value` - operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `notIn`                                                          |
| `group`             | `AND`/`OR` over a list of child conditions, with short-circuit evaluation                                                                                       |
| `not`               | negates a single child condition                                                                                                                                |
| `exists`            | true only if the referenced field is present (not `undefined`) on the subject/related entity                                                                    |
| `relationshipCheck` | true if the subject has an outgoing/incoming relationship of a given type, optionally count-bounded and/or filtered by a nested condition on the related entity |
| `fragmentRef`       | resolves to a named `RuleFragment`'s condition tree at evaluation time                                                                                          |

A `FieldRef` (`{ source: "subject" | "related", attribute }`) selects which entity a comparison reads from - `"related"` is only meaningful inside a `relationshipCheck`'s `targetCondition`. `attribute` supports dot-paths into JSON (e.g. `metadata.tensileStrength`).

`RuleScope` (`{ entityType, filter? }`) selects the candidate population a rule runs against: all entities of `entityType`, optionally narrowed by a `filter` condition evaluated the same way as `conditionRoot`.

## Pure Evaluation (`engine/evaluate-condition.ts`)

`evaluateCondition(condition, context, focus)` is a pure, synchronous function - no I/O, fully unit-testable. `context` (`EvaluationContext`) supplies every relationship/related-entity/fragment lookup the tree could need, pre-fetched by the caller. This is what keeps the evaluator deterministic: given the same condition tree and the same context, the result is always identical.

- `AND` groups short-circuit on the first `false` child; `OR` groups short-circuit on the first `true` child.
- A comparison or `exists` check against a field that isn't present on the entity adds the field's dot-path to `missingFields` rather than resolving to `false` - this is the mechanism that produces `INSUFFICIENT_EVIDENCE` (see below), not a silent failure.
- Every node produces a `TraceNode` (`{ type, description, result, children?, detail? }`) - the full tree of these is what `RuleExecutionResult.trace` stores, and what the Execution Result page renders.
- `collectMatchedEntityIds(trace)` walks the trace afterward to compute which entity ids actually participated in the result, stored as `supportingEntityIds`.

## Evidence Resolution (`engine/evidence-resolution.ts`)

`resolveEvidence(subject, matchingExtractions)` is a second pure function, independent of condition evaluation. It soft-links the subject `EngineeringEntity` to any `ExtractedEntity` rows sharing the same `(organizationId, entityType, identifier)` and:

- Turns each matching extraction into a `supportingDocumentRefs` entry (document id, version, page/section, confidence) - provenance, not proof.
- Compares each extraction's `attributes` against the subject's canonical `metadata` **only for keys present on both sides**; a mismatch becomes a `conflictingEvidence` entry. A key missing from either side is absence of data, not a conflict - the no-fabrication rule applies here too.

## Outcome Derivation and Dependency Gating

For each (rule, subject entity) pair, `engine/orchestrator.ts`'s `evaluateForSubject()`:

1. Checks `getUnmetDependencies()` - every `RuleDependency` for this rule, looking at the latest `RuleExecutionResult` for the _same subject entity_. If any dependency's latest result isn't `PASSED` (including "never evaluated"), the outcome is `BLOCKED` and condition evaluation doesn't even run.
2. Otherwise fetches matching extractions, runs `evaluateCondition()` and `resolveEvidence()`, and derives the outcome in this precedence:
   - `missingFields.length > 0` → `INSUFFICIENT_EVIDENCE`
   - else `conflictingEvidence.length > 0` → `NEEDS_REVIEW`
   - else the condition's boolean result → `PASSED` or `FAILED`
3. Persists a new `RuleExecutionResult` row (see `rule-model.md`) and writes a `RULE_EXECUTED` audit entry.

## Incremental Evaluation and Caching

Unless `force: true` is passed, `evaluateForSubject()` looks for the most recent `RuleExecutionResult` at the **same rule version** for that subject. If that cached result is newer than the subject entity's `updatedAt`, it's returned as-is (`cached: true`) instead of re-evaluating - a rule only needs to re-run when its own definition changed (new version) or the subject data changed since the last evaluation.

## Single, Batch, and Dependency-Ordered Execution

- `executeRule(ruleId, organizationId, options)` - resolves the rule's scope to candidate entities (applying `scope.filter` if present), builds one shared `EvaluationContext` for the whole candidate set (`buildSharedContext()` - a single batched relationship query + a single batched related-entity query + a single batched fragment fetch, not a per-entity round trip), then evaluates each candidate with a concurrency cap (`RULE_EXECUTION_CONCURRENCY = 4`, same pattern as the ingestion queue runner).
- `executeBatch(ruleIds, organizationId, options)` - orders the requested rules via `dependency-graph.ts`'s `topologicalOrder()` (Kahn's algorithm; throws `CircularDependencyError` if the requested set contains a cycle) so that a rule's dependencies are evaluated before it, generates one shared `batchId` (`randomUUID()`), and runs `executeRule()` for each rule in order.

## Performance Design (100,000+ rules, millions of evaluations)

- **Batched queries, not N+1.** `buildSharedContext()` is the single place all relationship/entity/fragment data for a run is fetched - one query per kind regardless of candidate count.
- **Incremental evaluation** (above) means re-running a batch after a small data change only re-evaluates rules/subjects whose cache is actually stale.
- **Bounded concurrency**, not unbounded `Promise.all`, keeps a large candidate population from overwhelming the database connection pool.
- **Not distributed and not load-tested.** No local PostgreSQL server is available in this environment, so this design is verified by unit-testing every pure function it's built from (condition evaluation, evidence resolution, dependency ordering) - not by benchmarking against real data at 100,000-rule scale. Swapping `orchestrator.ts`'s internals for a distributed job runner later requires no schema or API change.

## Related Documentation

- `rule-model.md` - the `RuleExecutionResult` schema these functions populate.
- `rule-engine.md` - the no-fabrication design principle behind `missingFields`/`INSUFFICIENT_EVIDENCE`.
- `rule-api.md` - the `/execute` and `/execute-batch` endpoints.
