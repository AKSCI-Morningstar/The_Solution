# Authentication Architecture

## Overview

The Morningstar Solution uses a session-based authentication system built on Next.js App Router patterns. Authentication is handled server-side with secure httpOnly cookies, database-backed sessions, and a layered service architecture.

## Authentication Flows

### Registration

1. User submits email, password, and optional name via the registration form
2. Client-side validation checks password length (≥8) and confirmation match
3. `POST /api/auth/register` calls `registerUser()` in the auth service
4. Service checks for duplicate email, hashes password with `scrypt`, creates User record
5. AuthEvent logged as `user.registered`
6. Returns the new user (without password hash)

### Login

1. User submits email and password via the login form
2. `POST /api/auth/login` calls `loginUser()` in the auth service
3. Service looks up user by email, verifies password hash with `timingSafeEqual`
4. Failed attempts are logged as `auth.login.failed`
5. On success: session is created (httpOnly cookie), `lastLoginAt` updated, `auth.login.success` event logged
6. User is redirected to dashboard

### Session Validation

1. Every authenticated API request passes through middleware
2. `src/middleware.ts` reads the "morningstar_session" cookie
3. `src/server/auth/session-service.ts:validateSession()` queries the Session table
4. Validates: token exists, not revoked, not expired
5. Expired sessions are automatically cleaned up
6. Returns `{ userId, sessionId }` or null

### Logout

1. `POST /api/auth/logout` calls `logoutUser()`
2. Session is deleted from database
3. Cookie is cleared (maxAge: 0)
4. AuthEvent logged as `auth.logout`

### Password Reset

1. User requests reset via `POST /api/auth/forgot-password`
2. A `VerificationToken` of type `password_reset` is created (1-hour expiry)
3. Token is stored as random 48-byte hex string
4. `POST /api/auth/reset-password` consumes the token, hashes new password, updates user
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

- Session tokens are 48 random bytes, hex-encoded
- Cookies are httpOnly, SameSite=Lax, Secure in production
- Sessions have configurable expiry (24h default, 30d with "remember me")
- Expired sessions are cleaned up on validation
- Sessions can be revoked (for future "logout everywhere" support)

### API Protection

- All `/api/auth/*` endpoints validate input
- Rate limiting architecture in place for future implementation
- CORS and security headers managed by Next.js configuration
- Request sanitization via Zod validation

## Session Lifecycle

```
Login → Create Session → Set Cookie → API Requests → Validate → Renew → Logout → Delete Session
         ↓                                        ↓                              ↓
     DB store                               Auto-cleanup expired           Cookie cleared
```

## Auth Guards

### API Routes

The middleware at `src/middleware.ts` protects all API routes except public auth endpoints. Unauthenticated requests receive a 401 response.

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
- `token` (unique) - Random session token
- `userId` - Foreign key to User
- `userAgent` / `ipAddress` - Request metadata
- `expiresAt` - Session expiry
- `isRevoked` - Manual revocation flag

### VerificationToken

- Used for password reset (future: email verification)
- One-time use with expiry
- Tokens cannot be replayed

### AuthEvent

- Immutable audit log for all auth-related events
- Tracks: login success/failure, logout, registration, password changes
