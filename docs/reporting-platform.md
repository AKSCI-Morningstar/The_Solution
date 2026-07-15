# Enterprise Reporting & Engineering Analytics Platform

## Overview

The Reporting Platform transforms the engineering data already produced by every other subsystem into
actionable reports, dashboards, and exports. It performs no generative or probabilistic analysis - every
number a report or dashboard shows is a direct, deterministic aggregation over data the Engineering
domain, Evidence Resolution Engine, Contradiction Engine, Rule Engine, Knowledge Graph, Ingestion
Pipeline, Organizations, and Audit Log have already persisted.

## Integration summary

| System                             | How it's consumed                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organizations / RBAC               | Every report, analytics query, and export is scoped to `requireActiveOrganization()` and gated by a new `reporting` permission resource (`read`/`execute`/`manage`).                                                      |
| Engineering Knowledge Graph        | Node/edge counts and growth trends (`GraphNodeIndex`/`GraphEdgeIndex`).                                                                                                                                                   |
| Engineering Documents (Ingestion)  | Document/job volume and status breakdowns (`IngestionDocument`/`IngestionJob`).                                                                                                                                           |
| Evidence Resolution Engine         | Evidence completeness is derived from `ExtractedEntity.linkedEntityId` references - the same linkage the Evidence Engine itself relies on.                                                                                |
| Contradiction Engine               | Open/resolved contradiction counts, severity breakdown, supplier-contradiction count.                                                                                                                                     |
| Rule Engine                        | Rule pass rate and per-rule compliance, read from `RuleExecutionResult` - never re-executed.                                                                                                                              |
| Requirements Traceability          | Requirement coverage is derived from `EngineeringEntity` relationships for `entityType = REQUIREMENT`.                                                                                                                    |
| Engineering Reality Assessments    | Not modified by this platform (explicitly out of scope) - a future report type can read `RealityAssessment` the same read-only way every other integration here does.                                                     |
| Engineering Reasoning Orchestrator | Not modified by this platform.                                                                                                                                                                                            |
| Audit Logs                         | Every report generation, view-adjacent action, export, deletion, and favorite/unfavorite toggle writes to the shared `AuditLog` via `recordAuditEvent()`; the Audit Report type also reads `AuditLog` as its data source. |
| Notifications                      | Not wired in this foundation - report generation is synchronous and returns immediately, so there is no long-running job to notify about (see Performance Strategy).                                                      |

## Architecture

```
src/server/reporting/
  constants.ts             12 report types, export formats, audit actions, risk/supplier constants
  types.ts                  AnalyticsSnapshot, ReportPayload, TrendPoint
  validation.ts             Zod schemas (generate/list/analytics/export filters)
  analytics-service.ts       the deterministic analytics engine (see analytics-engine.md)
  report-service.ts          generate/list/get/delete/favorite + audit
  export-service.ts           CSV/JSON generation, PDF/Excel architecture (see export-system.md)
  generators/
    executive.ts              Executive, Engineering Health, Risk Summary
    engineering.ts             Engineering, Requirement Coverage, Evidence Coverage, KG Statistics
    compliance.ts               Contradiction, Rule Compliance, Supplier
    operations.ts                Document Activity, Audit
```

Every report generator has the same signature - `(organizationId, filters) => Promise<ReportPayload>` -
and is registered once in `generators/index.ts`'s `GENERATORS` map, the single place the report-type-to-
generator mapping is defined.

## Report model

A `Report` row is created for every generation and never mutated except its `isFavorite` flag - "saved
reports" is simply this table, not a separate concept. See `report-builder.md` for the full data model
and `report-api.md` for the endpoint reference.

## Determinism guarantees

- Every generator is a direct Prisma aggregation (`count`, `groupBy`, `findMany`) - no model inference,
  no sampling, no randomness.
- The same `type` + `filters` against unchanged underlying data always produces the same `ReportPayload`.
- Analytics percentages are computed with a single, fixed formula (`numerator / denominator * 100`,
  rounded to 2 decimal places) - documented in full in `analytics-engine.md`.
