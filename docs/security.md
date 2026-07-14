# Security Architecture

## Overview

The Morningstar Solution implements defense-in-depth security principles. This document outlines the security measures at each layer of the application.

## Password Security

| Property          | Implementation               |
| ----------------- | ---------------------------- |
| Hashing algorithm | scrypt (N=16384, r=8, p=1)   |
| Salt              | 32 random bytes per password |
| Key length        | 64 bytes                     |
| Comparison        | timingSafeEqual              |
| Minimum length    | 8 characters                 |

## Session Security

| Property           | Implementation                                                              |
| ------------------ | --------------------------------------------------------------------------- |
| Token generation   | crypto.randomBytes(48)                                                      |
| Token storage      | SHA-256 hash only - the raw token never touches the database                |
| Cookie name        | morningstar_session                                                         |
| httpOnly           | Yes                                                                         |
| SameSite           | Lax                                                                         |
| Secure             | Yes (production)                                                            |
| Default expiry     | 24 hours                                                                    |
| Remember me expiry | 30 days                                                                     |
| Revocation         | Database flag, plus automatic revocation of every session on password reset |

## RBAC Enforcement

Every mutating and read endpoint scoped to an organization checks a specific `resource:action` permission (`requirePermission()`) on top of plain org-membership, covering rules, engineering entities/relationships, documents/ingestion jobs, knowledge graph nodes/edges/layouts, evidence, and contradictions. `DEFAULT_ROLES` (Owner/Admin/Manager/Engineer/Viewer) each carry an explicit, enumerated permission set - see `src/server/rbac/permissions.ts` for the full matrix. Permission strings never imply each other implicitly (`resource:manage` does not grant `resource:read`) - each role lists every permission it needs.

## API Security

- All API routes (except public auth endpoints) require authentication via middleware; unauthenticated page requests are redirected to `/login` server-side rather than rendering a shell with no data
- `POST /api/auth/login` is rate-limited in-process (10 attempts / 15 minutes, keyed by email and by source IP) - see `src/server/auth/rate-limiter.ts`. This is a single-instance mitigation, not a distributed one; a horizontally-scaled deployment needs a shared store (Redis or equivalent) for the same guarantee across instances
- Uploaded files are capped at `config.ingestionMaxFileSizeBytes` (env-configurable via `INGESTION_MAX_FILE_SIZE_BYTES`, default 200MB), checked before the request body is fully buffered
- Input validation using Zod schemas
- Structured error responses that do not leak internals
- Request IDs: `src/middleware.ts` generates (or forwards) an `x-request-id` header on every request/response pair for log correlation
- No raw SQL anywhere in the codebase - all database access goes through Prisma's parameterized query builder
- No `dangerouslySetInnerHTML` anywhere in the codebase - React's default escaping is relied on throughout

## Audit Trail

All authentication events are logged to the `AuthEvent` table:

- Login success and failure
- Logout
- Registration
- Password reset requests and completions

Rule Engine mutations (create/update/delete/publish/execute) are logged to the generic `AuditLog` table, which is now `organizationId`-scoped so audit history can be queried per tenant.

## Known Gaps (documented, not hidden)

- **CSRF**: mitigated by `SameSite=Lax` cookies (blocks the common cross-site auto-submit-form vector) but there is no double-submit-cookie or synchronizer-token layer on top. Acceptable for the current threat model; worth revisiting if third-party embedding or cross-origin API consumption is ever introduced.
- **Rate limiting** covers login only; registration and forgot-password remain unlimited (forgot-password already returns a generic "if the email exists" response regardless of outcome, which limits - but doesn't eliminate - account enumeration).
- **No MFA/TOTP, SSO/OAuth, or API key authentication.**
- **No email verification enforcement** - `User.isEmailVerified` exists on the model but nothing currently requires it to be true.
