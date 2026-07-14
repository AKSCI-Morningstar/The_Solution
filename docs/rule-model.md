# Rule Data Model

## `Rule`

The mutable, current-state row for a rule. One row per rule per organization.

| Field                                           | Type                                              | Notes                                                                |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| `id`                                            | string (cuid)                                     |                                                                      |
| `organizationId`                                | string                                            | org-scoped; indexed                                                  |
| `name`                                          | string                                            | unique per organization                                              |
| `description`                                   | string?                                           |                                                                      |
| `category`                                      | string                                            | free-form; UI suggests `RULE_CATEGORIES`, orgs may use custom values |
| `priority`                                      | int (default 0)                                   | higher runs first within a batch tie-break                           |
| `severity`                                      | `INFO` \| `WARNING` \| `ERROR` \| `CRITICAL`      |                                                                      |
| `status`                                        | `DRAFT` \| `ACTIVE` \| `DEPRECATED` \| `ARCHIVED` | new rules start `DRAFT`; only `DRAFT` can be published to `ACTIVE`   |
| `version`                                       | int (default 1)                                   | incremented on every update; mirrored into a `RuleVersion` snapshot  |
| `tags`                                          | string[] (Json)                                   |                                                                      |
| `labels`                                        | Record<string,string> (Json)                      |                                                                      |
| `ownerId`                                       | string?                                           | references `User`                                                    |
| `scope`                                         | Json (`RuleScope`)                                | `{ entityType, filter? }` - which entities the rule runs against     |
| `conditionRoot`                                 | Json (`RuleCondition`)                            | the deterministic condition tree                                     |
| `createdById` / `updatedById` / `publishedById` | string                                            | `User` references                                                    |
| `createdAt` / `updatedAt` / `publishedAt`       | DateTime                                          | `publishedAt` set only on `DRAFT → ACTIVE` transition                |
| `deletedAt`                                     | DateTime?                                         | soft delete                                                          |

Indexes: `organizationId`, `[organizationId, status]`, `[organizationId, category]`, `ownerId`, `deletedAt`.

## `RuleVersion`

An immutable snapshot written on every create/update - exact mirror of `EntityVersion`.

| Field               | Type     | Notes                                  |
| ------------------- | -------- | -------------------------------------- |
| `id`                | string   |                                        |
| `ruleId`            | string   |                                        |
| `version`           | int      | `@@unique([ruleId, version])`          |
| `snapshot`          | Json     | the full input payload at that version |
| `changeDescription` | string?  | optional author-supplied note          |
| `createdById`       | string   |                                        |
| `createdAt`         | DateTime |                                        |

## `RuleFragment`

A reusable, named condition sub-tree that any rule's condition (or scope filter) can reference via a `fragmentRef` node.

| Field                     | Type                   | Notes                           |
| ------------------------- | ---------------------- | ------------------------------- |
| `id`                      | string                 |                                 |
| `organizationId`          | string                 | unique `[organizationId, name]` |
| `name`                    | string                 |                                 |
| `description`             | string?                |                                 |
| `condition`               | Json (`RuleCondition`) |                                 |
| `version`                 | int                    |                                 |
| `createdById`             | string                 |                                 |
| `createdAt` / `updatedAt` | DateTime               |                                 |

## `RuleDependency`

A relational (not JSON-blob) edge, matching how `EngineeringRelationship` already models edges in this schema.

| Field             | Type   | Notes                 |
| ----------------- | ------ | --------------------- |
| `id`              | string |                       |
| `ruleId`          | string | the dependent rule    |
| `dependsOnRuleId` | string | the prerequisite rule |
| `organizationId`  | string |                       |

`@@unique([ruleId, dependsOnRuleId])`. Used both for cycle detection at save time (`validation-engine.ts`) and topological ordering at batch-execution time (`engine/dependency-graph.ts`).

## `RuleExecutionResult`

One **immutable** row per (rule, subject entity) evaluation. Never updated or deleted by application code - this is what "immutable execution history" means in practice. `subjectEntityId` is a plain scalar with **no FK** to `EngineeringEntity`, so execution history survives even if the subject entity is later deleted.

| Field                    | Type                                                                           | Notes                                                  |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `id`                     | string                                                                         |                                                        |
| `organizationId`         | string                                                                         |                                                        |
| `ruleId`                 | string                                                                         |                                                        |
| `ruleVersion`            | int                                                                            | the `Rule.version` in effect at evaluation time        |
| `subjectEntityId`        | string                                                                         | scalar, no FK (see above)                              |
| `batchId`                | string?                                                                        | correlates rows from the same `executeBatch()` call    |
| `outcome`                | `PASSED` \| `FAILED` \| `NEEDS_REVIEW` \| `BLOCKED` \| `INSUFFICIENT_EVIDENCE` |                                                        |
| `trace`                  | Json (`TraceNode`)                                                             | full evaluation path, see `rule-execution.md`          |
| `supportingEntityIds`    | Json (string[])                                                                | every entity id the condition tree actually touched    |
| `supportingDocumentRefs` | Json                                                                           | linked extraction records supporting the subject       |
| `missingEvidence`        | Json (string[])                                                                | fields the condition tree referenced but couldn't find |
| `conflictingEvidence`    | Json                                                                           | canonical-vs-extracted attribute mismatches            |
| `executionTimeMs`        | int                                                                            |                                                        |
| `evaluatedAt`            | DateTime                                                                       |                                                        |
| `triggeredById`          | string?                                                                        | `User` reference; absent for system-triggered runs     |

Indexes: `organizationId`, `ruleId`, `[organizationId, ruleId, subjectEntityId]` (cache lookups), `subjectEntityId`, `batchId`, `outcome`.

## Related Documentation

- `rule-engine.md` - overall architecture and no-fabrication design principle.
- `rule-execution.md` - how these rows get written, including the incremental-evaluation cache check.
- `rule-validation.md` - the checks that gate `Rule`/`RuleDependency` writes.
