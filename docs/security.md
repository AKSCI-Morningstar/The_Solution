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

## Content Security Policy

Every response (`src/middleware.ts`) carries a nonce-based CSP built by `src/server/security/csp.ts`:

- `script-src 'self' 'nonce-<per-request>' 'strict-dynamic'` in production - only scripts carrying the current request's nonce (or loaded by one) may execute. The app authors no inline `<script>` tags itself; Next.js automatically applies the nonce it finds in the CSP response header to its own framework scripts, which is why no additional per-component wiring was needed.
- `'unsafe-eval'` is added to `script-src` **only** outside production - React's development build uses `eval()` for debugging features (stack reconstruction, HMR) and says so explicitly in its own console warning ("React will never use eval() in production mode"). The production policy never includes it.
- `style-src 'self' 'unsafe-inline'` - Tailwind compiles to an external stylesheet, but Next's CSS-in-JS optimizations inject some inline styles; nonce-based `style-src` is materially harder to guarantee correctness for and lower-value than `script-src`, so this follows Next.js's own documented CSP recipe.
- `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` - no plugin content, no framing (clickjacking), no base-tag or form-target hijacking.
- `upgrade-insecure-requests` - production only.

The nonce is generated per-request with `crypto.randomUUID()` (the Web Crypto global, not Node's `crypto` module - middleware runs in the Edge runtime, which only supports the former).

## CSRF Protection

`src/server/security/csrf.ts`'s `isSameOriginRequest()` is checked in middleware for every mutating request (`POST`/`PUT`/`PATCH`/`DELETE`) to any `/api/*` route, including the public auth endpoints (login-CSRF - tricking a victim into authenticating as an attacker - is a real attack class, not just data-mutation CSRF). The request's `Origin` header (falling back to `Referer` if absent) must match the app's own origin, or the request is rejected with `403 CSRF_REJECTED` before it ever reaches a route handler. Safe methods (`GET`/`HEAD`/`OPTIONS`) are never checked, since they must not have side effects to begin with.

This is layered on top of - not a replacement for - `SameSite=Lax` session cookies, which already block the classic cross-site auto-submitting form attack. Origin-checking closes the remaining gap: a cross-origin `fetch`/`XHR` with credentials, or a same-site-but-different-subdomain attack. No server-side token store is needed, since browsers attach `Origin` to same-origin mutating requests automatically and don't let application code override it.

## Security Headers

Set on every response by `src/middleware.ts`, not just protected routes:

| Header                      | Value                                                            | Purpose                                                                  |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `X-Frame-Options`           | `DENY`                                                           | Defense-in-depth against clickjacking, alongside CSP's `frame-ancestors` |
| `X-Content-Type-Options`    | `nosniff`                                                        | Blocks MIME-sniffing attacks                                             |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                | Limits referrer leakage to third parties                                 |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                       | Disables browser features the app never uses                             |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (production only) | Enforces HTTPS after the first successful connection                     |
| `x-request-id`              | per-request UUID                                                 | Log correlation                                                          |

`poweredByHeader: false` in `next.config.ts` additionally removes the `X-Powered-By` header.

## API Security

- All API routes (except public auth endpoints) require authentication via middleware; unauthenticated page requests are redirected to `/login` server-side rather than rendering a shell with no data
- Rate limiting is in-process (`src/server/security/rate-limiter.ts`'s `createRateLimiter()`), applied to three flows, each its own independently-tuned, independently-keyed instance so one flow's abuse can't exhaust another's quota:
  - **Login** - 10 attempts / 15 minutes, keyed by email and by source IP independently
  - **Registration** - 5 attempts / 15 minutes, keyed by source IP
  - **Password reset requests** - 5 attempts / 15 minutes, keyed by email and by source IP independently

  This is a single-instance mitigation, not a distributed one; a horizontally-scaled deployment needs a shared store (Redis or equivalent) for the same guarantee across instances.

- Uploaded files are capped at `config.ingestionMaxFileSizeBytes` (env-configurable via `INGESTION_MAX_FILE_SIZE_BYTES`, default 200MB), checked before the request body is fully buffered
- Input validation using Zod schemas
- Structured error responses that do not leak internals
- Request IDs: `src/middleware.ts` generates (or forwards) an `x-request-id` header on every request/response pair for log correlation
- No raw SQL anywhere in the codebase - all database access goes through Prisma's parameterized query builder
- No `dangerouslySetInnerHTML` anywhere in the codebase - React's default escaping is relied on throughout

## Audit Trail and Security Event Logging

Authentication events are logged to the `AuthEvent` table: login success and failure, logout, registration, password reset requests and completions. Beyond the auth flows' own logging, `src/server/security/security-events.ts`'s `recordSecurityEvent()` writes to the same table for cross-cutting security signals:

- `rbac.permission_denied` - written centrally inside `requirePermission()` (`src/server/rbac/authorization-service.ts`) whenever a permission check fails, so every one of the ~40 RBAC-gated routes gets this logging for free rather than each route logging it individually
- `auth.rate_limited` - written whenever the login or password-reset limiter rejects a request

CSRF rejections are logged via the structured console logger (`src/shared/logging`), not `AuthEvent` - middleware runs in the Edge runtime, which cannot reach Prisma, so a CSRF rejection is observable in logs/log aggregators but not queryable from the database the way the other security events are.

Rule Engine mutations (create/update/delete/publish/execute) are logged to the generic `AuditLog` table, which is `organizationId`-scoped so audit history can be queried per tenant.

## Known Gaps (documented, not hidden)

- **No MFA/TOTP, SSO/OAuth, or API key authentication.**
- **No email verification enforcement** - `User.isEmailVerified` exists on the model but nothing currently requires it to be true.
- **Rate limiting and CSRF checks are single-instance** - both live in process memory / stateless origin-checking respectively; the rate limiter specifically needs a shared store before a horizontally-scaled deployment.
- **No dedicated security-event viewer UI** - `recordSecurityEvent()` writes are queryable directly against `AuthEvent` but aren't yet surfaced in the dashboard.
- **CSP's `style-src` still allows `'unsafe-inline'`** - a deliberate, documented trade-off (see above), not an oversight.
