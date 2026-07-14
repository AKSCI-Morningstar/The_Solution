# Rule Engine API Reference

Every route follows the same pattern as the rest of the platform: `requireActiveOrganization()` → `getCurrentUser()` → `requirePermission(orgId, userId, "rules:xxx")` → Zod `safeParse` → service call → `AppError`/`ValidationError` handling. See `rule-model.md`'s permission table for which role gets which `rules:*` permission.

| Method | Path                              | Permission      | Description                                                                              |
| ------ | --------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/api/rules`                      | `rules:read`    | List rules - filterable by `status`, `category`, `severity`, `search`, `tag`; paginated. |
| POST   | `/api/rules`                      | `rules:create`  | Create a rule (`DRAFT` status).                                                          |
| GET    | `/api/rules/:id`                  | `rules:read`    | Full rule detail, including `owner`, `dependsOn`, `dependents`.                          |
| PATCH  | `/api/rules/:id`                  | `rules:update`  | Update a rule - creates a new `RuleVersion`, increments `version`.                       |
| DELETE | `/api/rules/:id`                  | `rules:delete`  | Soft-delete - blocked if other rules still depend on it.                                 |
| POST   | `/api/rules/:id/publish`          | `rules:manage`  | `DRAFT → ACTIVE` - re-runs all validation checks first.                                  |
| GET    | `/api/rules/:id/versions`         | `rules:read`    | Immutable version history, newest first.                                                 |
| GET    | `/api/rules/:id/dependencies`     | `rules:read`    | `{ upstream, downstream }` rule references.                                              |
| POST   | `/api/rules/:id/execute`          | `rules:execute` | Evaluate one rule (`subjectEntityId?`, `force?`).                                        |
| POST   | `/api/rules/execute-batch`        | `rules:execute` | Evaluate multiple rules in dependency order (`ruleIds`, `force?`).                       |
| GET    | `/api/rules/:id/results`          | `rules:read`    | Paginated execution history - filterable by `outcome`, `batchId`.                        |
| GET    | `/api/rules/executions/:resultId` | `rules:read`    | Single execution result, including full trace and evidence.                              |
| GET    | `/api/rules/fragments`            | `rules:read`    | List reusable condition fragments - filterable by `search`.                              |
| POST   | `/api/rules/fragments`            | `rules:create`  | Create a fragment (rejects duplicate names, case-insensitive).                           |
| GET    | `/api/rules/fragments/:id`        | `rules:read`    | Single fragment detail.                                                                  |

## Request/Response Shapes

Input validation lives in `src/server/rules/validation.ts` (Zod). Notable schemas:

- `createRuleSchema` / `updateRuleSchema` - `name`, `description?`, `category`, `priority`, `severity`, `tags?`, `labels?`, `ownerId?`, `scope` (`RuleScope`), `conditionRoot` (`RuleCondition`), `dependsOnRuleIds?`. `updateRuleSchema` additionally accepts `changeDescription?`.
- `ruleFilterSchema` / `fragmentFilterSchema` - extend the shared `paginationSchema` with the filters listed above.
- `executeRuleSchema` - `{ subjectEntityId?, force? }`.
- `executeBatchSchema` - `{ ruleIds: string[] (1-500), force? }`.
- `ruleResultsFilterSchema` - extends `paginationSchema` with `outcome?`, `batchId?`.

All list endpoints return `{ data, total, page, pageSize, totalPages }`. All single-resource endpoints return `{ data }`. All validation failures return HTTP 400 with `{ error, details }` where `details` is Zod's `flatten().fieldErrors` shape (or, for engine-level validation failures like duplicate names/circular dependencies, a `ValidationError`'s equivalent `{ field: [message] }` structure - see `rule-validation.md`).

## Related Documentation

- `rule-model.md` - the underlying schema these endpoints read/write.
- `rule-execution.md` - what `execute`/`execute-batch` actually do.
- `rule-validation.md` - what can make `POST`/`PATCH`/`publish` fail with a 400.
