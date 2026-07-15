# Report Builder

## Data model

```prisma
model Report {
  id             String
  organizationId String
  type           String    // one of the 12 fixed report types
  title          String
  filters        Json      // the ReportFiltersInput used to generate it
  data           Json      // the computed ReportPayload, persisted immutably
  isFavorite     Boolean
  generatedById  String?
  createdAt      DateTime
  updatedAt      DateTime
}
```

Every generated report is persisted permanently - there is no separate "saved reports" concept.
"Saved reports" in the workspace is simply this table; "favorites" is the one mutable field
(`isFavorite`), toggled via `POST /api/reporting/reports/:id/favorite`. A generated report's `data` is
never recomputed or mutated after creation - re-running the same type and filters creates a new,
independent `Report` row, so historical reports remain exactly as they were generated.

## Report types (templates)

The 12 fixed types double as this platform's "report templates" - each has a name, a description
(`REPORT_TYPE_DESCRIPTIONS`), and a dedicated deterministic generator function. There is no
free-form/custom report definition in this foundation; every report is one of these 12 types with
optional filters:

| Type                         | What it computes                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `EXECUTIVE`                  | Every KPI in the analytics snapshot, one row per metric                                                             |
| `ENGINEERING`                | Entity counts and relationship density by entity type                                                               |
| `REQUIREMENT_COVERAGE`       | Per-requirement traceability coverage                                                                               |
| `EVIDENCE_COVERAGE`          | Per-entity linked-evidence coverage                                                                                 |
| `CONTRADICTION`              | Contradictions by type, severity, and open/resolved status                                                          |
| `RULE_COMPLIANCE`            | Per-rule execution outcomes and pass rate                                                                           |
| `SUPPLIER`                   | Supplier/manufacturer entities and supplier-contradiction count                                                     |
| `DOCUMENT_ACTIVITY`          | Ingestion document/job volume and status breakdown                                                                  |
| `KNOWLEDGE_GRAPH_STATISTICS` | Node/edge counts by entity type, recent growth                                                                      |
| `ENGINEERING_HEALTH`         | A composite score averaging rule compliance, evidence coverage, requirement coverage, and contradiction containment |
| `RISK_SUMMARY`               | Open high-severity contradictions, failed rules, and missing-evidence entities in one list                          |
| `AUDIT`                      | Recent `AuditLog` activity by action and entity                                                                     |

## Filtering, grouping, sorting

- **Filtering** (`ReportFiltersInput`): `from`/`to` (date range on the relevant `createdAt`/timestamp
  column), `entityType`, and `search` (case-insensitive substring match on the relevant name/title
  field) - passed to `POST /api/reporting/reports` at generation time and baked into the resulting
  report's persisted `data`.
- **Grouping**: each report type's generator already groups its own data along the dimension that
  makes sense for it (by entity type, by rule, by severity, by status) - there is no separate
  user-configurable grouping axis in this foundation.
- **Sorting**: the report _list_ (Explorer) supports `sortBy` (`createdAt`/`title`/`type`) and
  `sortOrder` (`asc`/`desc`); an individual report's _rows_ are sorted by each generator in the order
  most useful for that type (e.g. contradictions newest-first, entity breakdowns largest-first).

## Scheduling architecture (future)

Not implemented in this foundation. The documented seam: a `ReportSchedule` model (organizationId,
type, filters, cadence, nextRunAt, createdById) paired with a polling worker - the same
`processNextJob()`/`startQueueLoop()` pattern already used by the Ingestion Pipeline
(`src/server/ingestion/queue/runner.ts`) - would claim due schedules, call the same
`generateReport()` used by the interactive API, and create a `Notification` on completion (the
Notification Framework already exists and is unused by this platform precisely so a future scheduler
can adopt it without new infrastructure).

## Workspace UI

- **Report Explorer** (`/reports`) - tabs for All/Favorites, search, type filter, paginated list.
- **Report Builder** (`/reports/new`) - type picker with its description, optional title, and filter
  fields (date range, entity type, search).
- **Report Viewer** (`/reports/[id]`) - summary tiles, full data table, favorite/delete actions, export
  buttons.
- **Analytics Dashboard** (`/reports/analytics`) - KPI cards, coverage/compliance meters, trend charts,
  and breakdown bar charts, all built from dependency-free SVG chart primitives
  (`src/components/ui/charts/`).

"Recent Reports" is the Explorer's default sort (`createdAt desc`); there is no separate recent-items
page.
