# Reporting API

All endpoints require an active organization, an authenticated user, and the listed `reporting:*`
permission. Errors follow the platform-wide shape: `{ error: string, code?: string, details?: unknown
}` with the matching HTTP status.

## `POST /api/reporting/reports`

Generates a new report synchronously (every generator is a bounded aggregation query, not a
long-running pipeline). Permission: `reporting:execute`.

**Body:**

```json
{
  "type": "EXECUTIVE",
  "title": "optional custom title",
  "filters": {
    "from": "2026-01-01",
    "to": "2026-07-01",
    "entityType": "COMPONENT",
    "search": "engine"
  }
}
```

Returns the created `Report` row, including its computed `data`. Status: `201`.

## `GET /api/reporting/reports`

Paginated, filterable, sortable report list. Permission: `reporting:read`.

**Query params:** `page`, `pageSize` (max 100), `type`, `isFavorite`, `search` (matches title), `from`,
`to` (filters `createdAt`), `sortBy` (`createdAt`/`title`/`type`, default `createdAt`), `sortOrder`
(`asc`/`desc`, default `desc`).

**Response:** `{ data: Report[], total, page, pageSize, totalPages }`.

## `GET /api/reporting/reports/:id`

Full report detail, including its persisted `data` payload. Permission: `reporting:read`.

## `DELETE /api/reporting/reports/:id`

Permanently deletes a report. Permission: `reporting:manage`.

## `POST /api/reporting/reports/:id/favorite`

Toggles the report's `isFavorite` flag. Permission: `reporting:execute`.

## `GET /api/reporting/reports/:id/export?format=CSV|JSON|EXCEL|PDF`

Exports a report. Permission: `reporting:execute`. `CSV` and `JSON` return a real file via
`Content-Disposition: attachment` with the matching `Content-Type`. `EXCEL` and `PDF` return `200` with
`{ data: { implemented: false, format, architectureNote } }` describing the integration seam - see
`export-system.md`.

## `GET /api/reporting/analytics?trendWindowDays=30`

The full deterministic analytics snapshot (KPIs, trends, breakdowns). Permission: `reporting:read`.
`trendWindowDays` accepts 7-365, default 30.

## `GET /api/reporting/dashboard`

A curated KPI subset of the analytics snapshot, for the dashboard's summary cards. Permission:
`reporting:read`. Distinct from the platform's existing `/api/dashboard/summary` (which reports raw
entity/document/relationship/job counts only) - this endpoint is reporting-specific and reuses the same
`getAnalyticsSnapshot()` function the full `/api/reporting/analytics` endpoint calls, so there is exactly
one implementation of every KPI.
