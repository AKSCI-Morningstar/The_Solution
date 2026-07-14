# Rule Library

The Rule Library is the browsing/organization layer over the `Rule` and `RuleFragment` tables - no separate schema, just filtered/paginated views over the same data described in `rule-model.md`.

## Browsing and Filtering

`GET /api/rules` (`listRules`) supports:

- `search` - case-insensitive substring match on `name`.
- `status` - one of `DRAFT` / `ACTIVE` / `DEPRECATED` / `ARCHIVED`.
- `category` - exact match on the free-form category string.
- `severity` - one of `INFO` / `WARNING` / `ERROR` / `CRITICAL`.
- `tag` - exact match against an entry in the `tags` array.
- `page` / `pageSize` - standard pagination (shared `paginationSchema`).

Results are ordered by `priority desc, updatedAt desc` and include `_count` of `dependsOn`, `dependents`, and `executionResults` so the list view can surface dependency/activity signal without a second round trip.

The Rule Workspace's list page (`src/app/(dashboard)/rules/page.tsx`) exposes search plus status/severity filters and links into the detail page for each rule.

## Categories and Tags

`RULE_CATEGORIES` (`src/server/rules/constants.ts`) is a curated starting list (`ENGINEERING`, `REQUIREMENT`, `SPECIFICATION`, `MATERIAL`, `MANUFACTURING`, `CERTIFICATION`, `COMPLIANCE`, `SUPPLIER`, `INTERFACE`, `CONFIGURATION`, `LIFECYCLE`, `DOCUMENT`, `RELATIONSHIP`) offered as autocomplete suggestions in the editor - the underlying column is a plain string, so an organization can introduce new categories without any schema change. `tags` is a free-form string array for finer-grained, ad hoc grouping beyond category.

## Version History

Every create/update writes an immutable `RuleVersion` snapshot (`GET /api/rules/:id/versions`). This is the audit trail for "what did this rule look like at version N" - it is not itself versioned data used at evaluation time (evaluation always reads the current `Rule.conditionRoot`), it exists purely for history and rollback-by-hand.

## Reusable Fragments

`RuleFragment` rows (`docs/rule-model.md`) let a condition sub-tree be authored once and referenced from many rules via a `{ type: "fragmentRef", fragmentId }` condition node. The Fragment Library page (`src/app/(dashboard)/rules/fragments/page.tsx`) lists existing fragments and lets an author create new ones with the same condition-tree editor used for rules. `validation-engine.ts`'s `checkMissingReferences()` ensures a rule can't reference a fragment id that doesn't exist in the same organization.

## Templates

There is no separate "rule template" entity in this milestone - a fragment already serves the role of a reusable building block, and duplicating an existing rule (view its JSON via the API, adjust, and `POST /api/rules`) covers the "start from an existing rule" case without adding new schema surface.

## Related Documentation

- `rule-model.md` - the underlying `Rule`/`RuleFragment`/`RuleVersion` schema.
- `rule-api.md` - full endpoint reference, including filter parameters.
- `rule-validation.md` - duplicate-name and missing-fragment-reference checks enforced at save time.
