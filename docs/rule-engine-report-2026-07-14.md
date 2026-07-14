# Deterministic Engineering Rule Engine — Implementation Report

**Date:** 2026-07-14
**Scope:** Full deterministic rule engine milestone — data model, execution engine, validation engine, RBAC extension, API, workspace UI, documentation, and tests.

## 1. Rule Engine Architecture

The Rule Engine is a new `src/server/rules/` module, laid out exactly like the existing `src/server/engineering/` and `src/server/ingestion/` modules: `constants.ts`, `condition-types.ts`, `validation.ts`, `validation-engine.ts`, `rule-service.ts`, `fragment-service.ts`, an `index.ts` barrel, and an `engine/` subdirectory holding every pure evaluation function plus the one DB-touching orchestrator.

The core design constraint — **no AI, no probabilistic reasoning, no automatic resolution of engineering truth** — is enforced structurally, not just by convention:

- `evaluate-condition.ts` and `evidence-resolution.ts` are pure, synchronous, side-effect-free functions. They take pre-fetched plain data in and return a result; they never call an LLM, never assign a confidence score to an outcome, and never guess a value that isn't present in the data they were given.
- Every place a value could be "missing" (a comparison field absent from an entity, a fragment id that doesn't resolve, a relationship that doesn't exist) is treated as **missing evidence**, surfaced explicitly via `missingFields`/`INSUFFICIENT_EVIDENCE`, never silently coerced to `false` or fabricated.
- Evidence conflicts are only ever reported when both the canonical entity and a linked extraction actually have a value for the same key — absence on either side is "no data," never a fabricated conflict.

This makes the Rule Engine the platform's third data-producing pipeline (after the manually-authored canonical graph and the ingestion pipeline's staged extractions), all three of which remain intentionally separate and are only ever compared, never merged automatically.

## 2. Rule Execution Model

A `RuleCondition` is a JSON-serializable discriminated union with six node types — `comparison`, `group` (AND/OR with short-circuit), `not`, `exists`, `relationshipCheck`, and `fragmentRef` — validated end-to-end by a recursive Zod schema (`z.lazy()`), so the same shape is enforced at the API boundary and used by the evaluator, with no drift between the two.

`evaluateCondition()` produces both a boolean result and a full `TraceNode` tree describing exactly how that result was reached — every comparison, every short-circuit, every relationship match is recorded. Given the identical condition tree and the identical pre-fetched context, evaluation is 100% reproducible.

Outcome derivation follows a strict precedence, computed once per (rule, subject entity) pair in `engine/orchestrator.ts`:

1. `BLOCKED` — an unmet upstream dependency for this subject (checked before evaluation even runs).
2. `INSUFFICIENT_EVIDENCE` — the condition tree referenced at least one missing field.
3. `NEEDS_REVIEW` — clean evaluation, but canonical data conflicts with a linked extraction.
4. `PASSED` / `FAILED` — the condition tree's boolean result.

Execution supports single-rule (`executeRule`), batch (`executeBatch`, dependency-ordered via topological sort), incremental (a same-rule-version cached result newer than the subject's `updatedAt` is reused unless `force: true`), and concurrency-bounded (`RULE_EXECUTION_CONCURRENCY = 4`, matching the ingestion queue runner's pattern) evaluation.

## 3. Rule Dependency Model

Dependencies are a relational join table, `RuleDependency` (`ruleId`, `dependsOnRuleId`), not a JSON blob — matching how `EngineeringRelationship` already models edges in this schema. Two pure graph algorithms operate on it:

- `detectCycle()` — iterative DFS with a recursion stack, used both at save time (a rule can't be created/updated/published if doing so introduces a cycle) and at batch-execution time.
- `topologicalOrder()` — Kahn's algorithm, throws `CircularDependencyError` if the requested rule set itself contains a cycle; used to order `executeBatch()` so dependencies always run before their dependents.

At evaluation time, a rule with any unmet dependency (its dependency's latest result for the _same subject entity_ isn't `PASSED`) is marked `BLOCKED` before any condition logic runs — dependency gating is a hard precondition, not a scoring input.

## 4. Traceability Model

Every evaluation is fully traceable end-to-end:

- **What was evaluated** — `RuleExecutionResult.ruleId` + `ruleVersion` (the exact `Rule` definition in effect, immutable via `RuleVersion`).
- **Input evidence** — `supportingEntityIds` (every entity id the condition tree actually touched, computed by walking the trace) and `supportingDocumentRefs` (linked ingestion extraction records).
- **Evaluation path** — the full `TraceNode` tree in `trace`, rendered by the Execution Result page's trace viewer.
- **Final outcome** — one of the five outcomes above, plus `missingEvidence`/`conflictingEvidence` for full transparency into _why_.
- **Execution metadata** — `executionTimeMs`, `evaluatedAt`, `triggeredById`, `batchId` (correlating rows from the same batch run).

`RuleExecutionResult` rows are never updated or deleted by application code — `subjectEntityId` is a plain scalar with no FK, specifically so execution history survives even after the subject entity itself is later deleted.

## 5. Rule Library Overview

`GET /api/rules` supports search, status/category/severity/tag filtering, and pagination, ordered by priority then recency, with `_count` of dependencies/dependents/executions included for at-a-glance signal. Categories are a curated suggestion list over a free-form string column, so organizations aren't locked into a fixed taxonomy. `RuleFragment` provides reusable condition sub-trees referenced via `fragmentRef`, with its own library page and duplicate-name protection. Full version history is available per rule via the immutable `RuleVersion` snapshots.

## 6. API Summary

15 endpoints under `/api/rules`, every one following `requireActiveOrganization()` → `getCurrentUser()` → `requirePermission()` → Zod `safeParse()` → `AppError`/`ValidationError` handling:

- CRUD: `GET/POST /rules`, `GET/PATCH/DELETE /rules/:id`
- Lifecycle: `POST /rules/:id/publish`, `GET /rules/:id/versions`
- Dependencies: `GET /rules/:id/dependencies`
- Execution: `POST /rules/:id/execute`, `POST /rules/execute-batch`, `GET /rules/:id/results`, `GET /rules/executions/:resultId`
- Fragments: `GET/POST /rules/fragments`, `GET /rules/fragments/:id`

Full reference with request/response shapes: `docs/rule-api.md`.

## 7. Workspace Overview

`src/app/(dashboard)/rules/` (the pre-existing nav entry now points at a real workspace, no new nav wiring needed):

- `rules/` — filterable, paginated rule list with search and status/severity filters.
- `rules/new/`, `rules/[ruleId]/edit/` — a shared `RuleEditor`: metadata fields, scope picker, a recursive form-based condition-tree editor (`ConditionEditor`) supporting all six condition types with add/remove/nest, a dependency multi-select, and inline validation error display.
- `rules/[ruleId]/` — details view with tabs for Overview (condition/scope tree, read-only), Dependencies (upstream/downstream), and Execution Results, plus Execute/Publish/Edit/Delete actions.
- `rules/executions/[resultId]/` — full evaluation trace viewer plus an evidence panel (supporting documents, conflicting evidence, missing evidence).
- `rules/fragments/` — fragment library with inline creation.

All list/detail data flows through the API layer above (client components, `fetch`-based), matching the existing Engineering module's pattern rather than introducing a new data-fetching convention.

## 8. Documentation Summary

Six docs added under `docs/`, each cross-referencing the others:

- `rule-engine.md` — architecture, no-fabrication design principle, outcome derivation, known limitations.
- `rule-model.md` — full schema reference for all five new Prisma models.
- `rule-library.md` — browsing, filtering, categories, tags, fragments, version history.
- `rule-execution.md` — the condition DSL, pure evaluation, evidence resolution, dependency gating, incremental evaluation, batch execution, performance design.
- `rule-api.md` — full endpoint table and request/response shapes.
- `rule-validation.md` — every validation check and when it runs (create/update/publish/delete).

## 9. Performance Strategy

Designed for 100,000+ rules and millions of evaluations, though **not load-tested against a live database** — no local PostgreSQL server is available in this development environment (the same constraint as the ingestion milestone), so `pnpm db:push` could not be run; only `pnpm db:generate` (schema-only) was executed, and the design below is verified by type-checking plus exhaustive unit testing of every pure function it's built from, not by benchmarking against real data at scale:

- **Batched, not N+1** — `buildSharedContext()` fetches every relationship/related-entity/fragment a rule run could need in one query per kind, regardless of candidate population size.
- **Incremental evaluation** — a cached `RuleExecutionResult` at the same rule version, newer than the subject's `updatedAt`, is reused instead of re-evaluated.
- **Bounded concurrency** — `RULE_EXECUTION_CONCURRENCY = 4`, avoiding unbounded `Promise.all` against the connection pool, mirroring the ingestion queue runner's established pattern.
- **Indexed for the hot paths** — every new table has `organizationId` plus composite indexes matching actual query shapes (e.g. `RuleExecutionResult`'s `[organizationId, ruleId, subjectEntityId]` for cache lookups).
- **Not distributed** — batch execution is in-process; swapping `engine/orchestrator.ts`'s internals for a distributed executor later requires no schema or API change, matching the ingestion pipeline's stated upgrade path for its own queue runner.

## 10. Verification Checklist

| Check                                                        | Result                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:generate`                                           | ✅ Passed (schema-only; no live Postgres available to `db:push`)                                                                                                                      |
| `pnpm format:check`                                          | ✅ Passed                                                                                                                                                                             |
| `pnpm lint`                                                  | ✅ Passed, 0 errors/warnings                                                                                                                                                          |
| `pnpm typecheck`                                             | ✅ Passed, 0 errors                                                                                                                                                                   |
| `pnpm test`                                                  | ✅ Passed, 183/183 tests (79 new: `evaluate-condition`, `evidence-resolution`, `dependency-graph`, `validation-engine`, `condition-types` Zod schemas, `validation.ts` API schemas)   |
| `pnpm build`                                                 | ✅ Passed, all routes compiled including 5 new `/rules/*` pages and 15 new API routes                                                                                                 |
| No TODOs / dead code in new files                            | ✅ Confirmed                                                                                                                                                                          |
| No AI / probabilistic reasoning / automatic truth resolution | ✅ Confirmed — every non-deterministic-seeming path (missing evidence, conflicts, dependency gating) resolves to an explicit, inspectable outcome, never a fabricated or inferred one |

### Known Gaps (documented, not hidden)

- Not load-tested against a live PostgreSQL instance (no local server available this session) — see Performance Strategy above.
- No visual drag-and-drop condition editor — the JSON model plus form-based editor is designed to support one later without any data-model change.
- No cross-domain rule dependencies — rules and relationship checks operate against the engineering entity graph only.
- No distributed batch execution — in-process with bounded concurrency, upgradeable later without an API change.
