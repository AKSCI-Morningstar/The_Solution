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

| Property           | Implementation         |
| ------------------ | ---------------------- |
| Token generation   | crypto.randomBytes(48) |
| Cookie name        | morningstar_session    |
| httpOnly           | Yes                    |
| SameSite           | Lax                    |
| Secure             | Yes (production)       |
| Default expiry     | 24 hours               |
| Remember me expiry | 30 days                |
| Revocation         | Database flag          |

## API Security

- All API routes (except public auth endpoints) require authentication via middleware
- Input validation using Zod schemas
- Structured error responses that do not leak internals
- Correlation IDs for request tracing

## Audit Trail

All authentication events are logged to the `AuthEvent` table:

- Login success and failure
- Logout
- Registration
- Password reset requests and completions

## Future Security Measures

The following are architecturally prepared but not yet implemented:

- Rate limiting on auth endpoints
- CSRF protection
- MFA/TOTP support
- SSO/OAuth integration
- Account lockout after failed attempts
- Email verification
- API key authentication
