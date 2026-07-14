# Rule Validation

Beyond Zod's structural validation (already rejects invalid operators, malformed condition shapes, and out-of-range values at the request layer), `src/server/rules/validation-engine.ts` runs a set of pure, side-effect-free checks against a rule's full context before any create/update/publish is allowed to persist.

## Checks

| Check               | Function                    | What it catches                                                                                                                                                  |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate name      | `checkDuplicateName()`      | Another non-deleted rule in the same organization with the same name (case-insensitive).                                                                         |
| Missing references  | `checkMissingReferences()`  | A `dependsOnRuleIds` entry, or a `fragmentRef.fragmentId` anywhere in the condition tree, that doesn't exist in the same organization.                           |
| Circular dependency | `checkCircularDependency()` | Adding this rule's proposed dependency edges would create a cycle in the `RuleDependency` graph (DFS-based, via `engine/dependency-graph.ts`'s `detectCycle()`). |
| Broken conditions   | `checkBrokenConditions()`   | Structurally valid but logically inconsistent conditions - e.g. a `relationshipCheck`'s `expectedCount.min > max`.                                               |

`extractFragmentIds()` recursively walks a condition tree (including nested `group`, `not`, and `relationshipCheck.targetCondition` nodes) to find every `fragmentRef` used, which is what makes the missing-reference check exhaustive rather than shallow.

All issues from a single validation pass are collected and thrown together as one `ValidationError` (not one-at-a-time) so an author sees every problem in one round trip.

## When Validation Runs

- **Create** (`createRule`) - duplicate name, missing dependency/fragment references, broken conditions. A brand-new rule can't yet participate in an existing cycle by its own id, but a proposed dependency list is still checked against the existing dependency graph using a placeholder id, so a rule can't be created with a dependency set that would form a cycle once it exists.
- **Update** (`updateRule`) - the same checks, this time excluding the rule's own id from the duplicate-name and cycle checks (so a rule doesn't conflict with its own prior state).
- **Publish** (`publishRule`) - re-runs every check above (not just a subset) as the final gate before `DRAFT → ACTIVE`. Publishing a rule whose dependencies or fragments have since been deleted, or that now forms a cycle because a _different_ rule changed its own dependencies after this one was drafted, is caught here even if it wasn't at last save.
- **Delete** (`deleteRule`) - a distinct check, not part of `validation-engine.ts`: a rule cannot be deleted while any other rule still lists it as a dependency (enforced directly in `rule-service.ts` via a `RuleDependency` lookup, since this is about referential integrity at delete time rather than condition-tree correctness).

## Related Documentation

- `rule-model.md` - the `RuleDependency`/`RuleFragment` tables these checks query.
- `rule-api.md` - how validation failures surface as HTTP 400 responses.
- `rule-engine.md` - the broader no-fabrication principle these checks help enforce (a rule referencing something that doesn't exist is rejected outright, never silently ignored).
