# Session Management

## Overview

Sessions provide a secure, revocable way to maintain authenticated state across HTTP requests. The Morningstar Solution uses opaque database-backed session tokens rather than JWTs for maximum security and control.

## Session Creation

1. User credentials are validated by `loginUser()` (itself gated by an in-process login rate limiter - see `docs/security.md`)
2. `createSession()` generates a 48-byte random token
3. A SHA-256 hash of the token (never the raw token itself), user ID, metadata (user agent, IP), and expiry are stored in the `Session` table
4. An httpOnly cookie (`morningstar_session`) holding the _raw_ token is set on the response

## Session Validation

1. Each protected request goes through middleware, which redirects unauthenticated page requests to `/login` and returns `401` for unauthenticated API requests
2. `validateSession()` reads the cookie, hashes the token, and queries the database by that hash
3. Checks: token exists, not revoked, not expired
4. Expired sessions are automatically cleaned up
5. Returns `{ userId, sessionId }` or null

## Session Renewal

Every authenticated API request triggers `renewSession()` which extends the session expiry. This keeps active sessions alive while allowing inactive ones to expire naturally.

## Session Destruction

- **Logout**: Deletes the session from the database, clears the cookie
- **Expiry**: Sessions automatically expire after the configured duration
- **Password reset**: `destroyAllUserSessions()` deletes every session belonging to the user as part of `resetPassword()` - a stolen session cookie doesn't survive a password reset
- **Revocation**: `destroyAllUserSessions()` is also available standalone for a future "logout everywhere" user-initiated action; only the password-reset path calls it automatically today

## Cookie Configuration

```
morningstar_session:
  httpOnly: true       // Not accessible to JavaScript
  secure: true         // HTTPS only in production
  sameSite: lax        // CSRF protection
  path: /              // Available to all routes
  expires: <dynamic>   // Based on session duration
```

## Session Expiry

| Type        | Duration | Trigger                          |
| ----------- | -------- | -------------------------------- |
| Default     | 24 hours | Standard login                   |
| Remember me | 30 days  | Login with "remember me" checked |

## Future Enhancements

- Refresh token rotation
- Concurrent session limits
- Device tracking and management
- Session activity monitoring
