# Analytics Engine

## Overview

`src/server/reporting/analytics-service.ts` computes the full deterministic analytics snapshot for an
organization: `getAnalyticsSnapshot(organizationId, trendWindowDays)`. Every number is a direct
aggregation - counts, `groupBy`, and day-bucketed trend queries - over data other subsystems already
persisted. Nothing is inferred, estimated, or generated.

## KPIs and their exact formulas

| KPI                                                   | Formula                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `totalEntities`                                       | `count(EngineeringEntity)` where not soft-deleted                                                                       |
| `totalDocuments`                                      | `count(IngestionDocument)` where not soft-deleted                                                                       |
| `totalRelationships`                                  | `count(EngineeringRelationship)`                                                                                        |
| `evidenceCompletenessPercent`                         | distinct `ExtractedEntity.linkedEntityId` count ÷ `totalEntities` × 100                                                 |
| `requirementCoveragePercent`                          | `EngineeringEntity` rows with `entityType = REQUIREMENT` that have ≥1 relationship ÷ total `REQUIREMENT` entities × 100 |
| `rulePassRatePercent`                                 | `RuleExecutionResult` rows with `outcome = PASSED` ÷ total `RuleExecutionResult` rows × 100                             |
| `contradictionDensityPercent`                         | `count(Contradiction)` ÷ `totalEntities` × 100                                                                          |
| `openContradictionCount`                              | `count(Contradiction)` where `status` is `DETECTED` or `UNDER_REVIEW`                                                   |
| `knowledgeGraphNodeCount` / `knowledgeGraphEdgeCount` | `count(GraphNodeIndex)` / `count(GraphEdgeIndex)`                                                                       |

All percentages are rounded to 2 decimal places with a fixed `numerator / denominator * 100` formula; a
zero denominator always yields `0`, never `NaN` or a divide-by-zero error.

## Trend series

Four day-bucketed trend series over a configurable trailing window (default 30 days, 7-365 accepted):

- `knowledgeGraphGrowth` - `GraphNodeIndex` rows created per day
- `engineeringActivity` - `EngineeringEntity` rows created per day
- `documentActivity` - `IngestionDocument` rows created per day
- `auditActivity` - `AuditLog` rows created per day

Each is computed with one raw SQL query per table (`date_trunc('day', "createdAt")` grouped and
counted, scoped to `organizationId`) - the table name is always a hardcoded literal at the call site,
never derived from user input, so composing it into the raw query is safe. This platform targets
PostgreSQL exclusively (see `prisma/schema.prisma`), so a Postgres-specific `date_trunc` is an accepted,
documented choice rather than a portability gap.

## Breakdowns

- `ruleOutcomeBreakdown` - `RuleExecutionResult` grouped by `outcome`
- `contradictionSeverityBreakdown` - `Contradiction` grouped by `severity`
- `entityTypeBreakdown` - `EngineeringEntity` grouped by `entityType`
- `organizationMemberRoleBreakdown` - `OrganizationMember` grouped by `role`

## Dashboard KPIs

`getDashboardKpis(organizationId)` returns a curated subset of the full snapshot (the `kpis` object plus
the last 7 days of the two most dashboard-relevant trends) - it calls `getAnalyticsSnapshot` internally
rather than duplicating any query, so there is exactly one implementation of every metric in this
platform.

## Performance

Every KPI and breakdown in one snapshot is computed with a single `Promise.all` batch of independent
Prisma queries (counts, `groupBy`, and four raw trend queries) - no N+1 pattern, no per-entity round
trip, matching the batched-query convention already established by the Rule Engine and Evidence
Resolution Engine elsewhere in this codebase.
