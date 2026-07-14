# Authentication Architecture

## Overview

The Morningstar Solution uses a session-based authentication system built on Next.js App Router patterns. Authentication is handled server-side with secure httpOnly cookies, database-backed sessions, and a layered service architecture.

## Authentication Flows

### Registration

1. User submits email, password, and optional name via the registration form
2. Client-side validation checks password length (≥8) and confirmation match
3. `POST /api/auth/register` calls `registerUser()` in the auth service, which first checks an in-process rate limiter keyed by source IP (5 attempts per 15 minutes) - a request over the threshold is rejected with `429` before the duplicate-email check ever runs
4. Service checks for duplicate email, hashes password with `scrypt`, creates User record
5. AuthEvent logged as `user.registered`
6. Returns the new user (without password hash)

### Login

1. User submits email and password via the login form
2. `POST /api/auth/login` calls `loginUser()` in the auth service
3. Before touching the database, the request is checked against an in-process rate limiter keyed by both the submitted email and the source IP - a request over the threshold (10 attempts per 15-minute window per key) is rejected with `429` and a `Retry-After` header, without ever reaching the password check
4. Service looks up user by email, verifies password hash with `timingSafeEqual`
5. Failed attempts (wrong password, unknown email, disabled account) are logged as `auth.login.failed` and count against the rate limit
6. On success: the email's rate-limit counter is cleared, a session is created (httpOnly cookie), `lastLoginAt` updated, `auth.login.success` event logged
7. User is redirected to dashboard

### Session Validation

1. Every request (API and page) passes through middleware, which redirects unauthenticated page requests to `/login` and returns `401` for unauthenticated API requests, based purely on cookie presence
2. `src/middleware.ts` reads the "morningstar_session" cookie
3. `src/server/auth/session-service.ts:validateSession()` hashes the cookie's token (SHA-256) and queries the Session table by that hash - the raw token itself is never persisted, so a database leak alone cannot be replayed as a live session
4. Validates: token exists, not revoked, not expired
5. Expired sessions are automatically cleaned up
6. Returns `{ userId, sessionId }` or null

### Logout

1. `POST /api/auth/logout` calls `logoutUser()`
2. Session is deleted from database
3. Cookie is cleared (maxAge: 0)
4. AuthEvent logged as `auth.logout`

### Password Reset

1. User requests reset via `POST /api/auth/forgot-password`, which is rate-limited in-process (5 attempts per 15 minutes, keyed by email and by source IP independently) before the user lookup runs - a rate-limited request returns the same generic response as a successful one, so the response shape never reveals whether the limiter or the email lookup is why nothing was sent
2. A `VerificationToken` of type `password_reset` is created (1-hour expiry); the raw token is a random 48-byte hex string, but only its SHA-256 hash is persisted
3. `POST /api/auth/reset-password` consumes the token (looked up by hash), hashes the new password, updates the user
4. Every existing session for that user is destroyed as part of the same reset - a compromised account can't be "reset back" into by whoever held the old password's session
5. Used tokens cannot be replayed
6. AuthEvent logged at request and completion

## Security Architecture

### Password Storage

- Passwords are hashed using Node.js `crypto.scryptSync` with:
  - Salt: 32 random bytes (unique per password)
  - Key length: 64 bytes
  - CPU/memory cost parameters: N=16384, r=8, p=1
- Stored as hex-encoded `salt:hash` format
- Verification uses `timingSafeEqual` to prevent timing attacks

### Session Security

- Session tokens are 48 random bytes, hex-encoded, generated client-facing; only a SHA-256 hash of the token is ever written to the `Session` table
- Cookies are httpOnly, SameSite=Lax, Secure in production
- Sessions have configurable expiry (24h default, 30d with "remember me")
- Expired sessions are cleaned up on validation
- All of a user's sessions are destroyed via `destroyAllUserSessions()` whenever that user's password is reset

### API Protection

- All `/api/auth/*` endpoints validate input
- `POST /api/auth/login` is rate-limited in-process (10 attempts per 15 minutes, keyed by email and by source IP independently) - a first line of defense against credential stuffing and password spraying. This state lives in a single process's memory: it resets on restart and is not shared across horizontally-scaled instances. A multi-instance deployment should back this with a shared store (Redis or equivalent) instead
- CORS and security headers managed by Next.js configuration
- Request sanitization via Zod validation

## Session Lifecycle

```
Login → Create Session → Set Cookie → API Requests → Validate → Renew → Logout → Delete Session
         ↓                                        ↓                              ↓
     DB store                               Auto-cleanup expired           Cookie cleared
```

## Auth Guards

### API Routes and Pages

The middleware at `src/middleware.ts` protects all routes except an explicit public allowlist (the marketing home page, `/login`, `/register`, `/forgot-password`, `/reset-password`, and their `/api/auth/*` equivalents). An unauthenticated request to a protected API route receives a `401`; an unauthenticated request to a protected page is redirected to `/login?next=<original path>` server-side, before any page content renders.

### Client Components

The `<AuthGuard>` component wraps protected client-side content. It checks `/api/auth/me` and redirects to login with a return URL on failure.

### Server Components

Use `getCurrentUser()` to check authentication in server components and server actions.

## Models

### User

- `id` (cuid) - Primary key
- `email` (unique) - User's email address
- `name` (optional) - Display name
- `passwordHash` - scrypt hash
- `isEmailVerified` - Email verification status
- `status` - Account status (active, disabled, suspended)
- `lastLoginAt` - Timestamp of last successful login
- `metadata` - JSON for extensible profile data
- `deletedAt` - Soft delete support

### Session

- `id` (cuid) - Primary key
- `token` (unique) - SHA-256 hash of the session token (the raw token only ever lives in the httpOnly cookie)
- `userId` - Foreign key to User
- `userAgent` / `ipAddress` - Request metadata
- `expiresAt` - Session expiry
- `isRevoked` - Manual revocation flag

### VerificationToken

- Used for password reset (future: email verification)
- `token` (unique) - SHA-256 hash of the token (same rationale as `Session.token`)
- One-time use with expiry
- Tokens cannot be replayed

### AuthEvent

- Immutable audit log for all auth-related events
- Tracks: login success/failure, logout, registration, password changes
