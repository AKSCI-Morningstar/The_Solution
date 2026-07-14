# Ingestion Pipeline API Reference

All routes require an active session (`getCurrentUser()`) and an active organization (`requireActiveOrganization()`), matching every other module in the platform. Every list endpoint returns `{ data, total, page, pageSize, totalPages }`; single-resource endpoints return `{ data }`; errors return `{ error, code, details? }` with the matching HTTP status.

## Documents

### `GET /api/ingestion/documents`

Query params: `page`, `pageSize`, `search` (filename contains, case-insensitive).

### `POST /api/ingestion/documents`

`multipart/form-data` with a `file` field. Creates the document and its first version (`version: 1`). Returns `201` with the created `IngestionDocument`.

### `GET /api/ingestion/documents/:id`

Returns the document with its full version history and its 20 most recent jobs.

### `POST /api/ingestion/documents/:id/versions`

`multipart/form-data` with a `file` field. Uploads a new version (`currentVersion + 1`) of an existing document.

### `POST /api/ingestion/documents/:id/reprocess`

Starts a new ingestion job against the document's _current_ version. Returns `201` with the created `IngestionJob`.

## Jobs

### `GET /api/ingestion/jobs`

Query params: `page`, `pageSize`, `status` (`QUEUED|RUNNING|SUCCEEDED|FAILED|CANCELLED`), `documentId`.

### `POST /api/ingestion/jobs`

Body: `{ documentId: string, documentVersionId?: string, priority?: number, scheduledAt?: string }`. Omitting `documentVersionId` uses the document's current version. Returns `201` with the created `IngestionJob` (status `QUEUED`) and lazily starts the in-process queue loop.

### `GET /api/ingestion/jobs/:id`

Returns the job with its document/version summary and full ordered `stageLogs`.

### `GET /api/ingestion/jobs/:id/results`

Query params: `page`, `pageSize` (paginates `entities` only - `relationships`/`references` are capped at 500 and returned in full, since they're always bounded by the entity count of a single document). Response:

```json
{
  "data": {
    "entities": { "data": [...], "total": 12, "page": 1, "pageSize": 20, "totalPages": 1 },
    "relationships": [...],
    "references": [...],
    "issues": [...],
    "graphPreview": { "nodes": [...], "edges": [...] }
  }
}
```

### `POST /api/ingestion/jobs/:id/cancel`

A `QUEUED` job is cancelled immediately. A `RUNNING` job is signaled (`cancelRequested`) and stops at the next stage boundary. Already-terminal jobs return `400 ValidationError`.

### `POST /api/ingestion/jobs/:id/retry`

Only valid for `FAILED`/`CANCELLED` jobs with `attempt < maxAttempts`. Resets progress/error fields, increments `attempt`, requeues, and restarts the queue loop.

## Parsers

### `GET /api/ingestion/parsers`

Returns the parser registry's current health snapshot: `{ parserName, parserVersion, totalRuns, totalFailures, consecutiveFailures, lastSuccessAt, lastErrorAt, lastErrorMessage }[]`.
