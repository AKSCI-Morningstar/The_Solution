# Audit Log

Organization-scoped immutable activity trail for compliance and forensics.

## Capabilities

- **Read API**: `GET /api/audit` with Zod-validated filters
- **Export API**: `GET /api/audit/export` returns CSV (up to 5,000 rows)
- **UI**: `/audit` — filterable table with pagination and CSV export
- **Write path**: unchanged — subsystems continue calling `recordAuditEvent()`

## Permissions

Requires `settings:read` on the active organization.

## Query parameters

| Param         | Type         | Notes                          |
| ------------- | ------------ | ------------------------------ |
| `page`        | number       | Default 1                      |
| `pageSize`    | number       | Default 20, max 100            |
| `action`      | string       | Case-insensitive contains      |
| `entity`      | string       | Exact entity type              |
| `entityId`    | string       | Exact entity id                |
| `search`      | string       | Matches action/entity/entityId |
| `from` / `to` | ISO datetime | Inclusive createdAt range      |

## Indexes

`AuditLog` includes composite indexes on `(organizationId, createdAt)` and `(organizationId, action)` for filtered pagination.
