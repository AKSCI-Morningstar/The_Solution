# Multi-Tenancy Architecture

## Overview

The Morningstar Solution enforces multi-tenancy through organization-level data isolation. Every feature module operates within the context of a single organization, preventing accidental or malicious cross-tenant data access.

## Tenant Resolution

The active organization is resolved through a two-layer strategy:

### 1. Cookie-Based Active Organization

A httpOnly cookie (`morningstar_org`) stores the user's currently active organization ID.

```typescript
// organization-context.ts
export async function getActiveOrganizationId(): Promise<string | null>;
export async function setActiveOrganizationId(organizationId: string): Promise<void>;
export async function clearActiveOrganizationId(): Promise<void>;
```

### 2. Membership Verification

Every organization-scoped operation verifies that the authenticated user is an active member of the claimed organization:

```typescript
export async function requireActiveOrganization(): Promise<string>;
export async function resolveActiveOrganization(): Promise<{
  id: string;
  name: string;
  slug: string;
} | null>;
```

## Tenant Isolation Strategy

### Service Layer

All server functions that access organization-scoped data accept an explicit `organizationId` parameter. This makes tenant boundaries visible in the function signature and prevents accidental cross-org access.

```typescript
// Example pattern
export async function getOrganizationData(organizationId: string, ...): Promise<Data>
```

### Database Layer

All organization-scoped models include `organizationId` as a foreign key with indexes. Queries always filter by `organizationId`.

### Membership Check

Before any organization-scoped operation, the system verifies:

1. User is authenticated (session cookie)
2. User is an active member of the organization
3. User's role is sufficient for the operation (owner-only actions)

## Future Tenant Scaling

The architecture supports future enterprise scenarios:

- **Cross-organization data sharing**: Explicit opt-in data sharing between orgs
- **Organization hierarchies**: Parent/child organization relationships
- **Data migration**: Tools to move data between organizations
- **Audit trails**: Per-organization audit logging
- **Quotas and limits**: Per-organization resource usage tracking

## Tenant Isolation Rules

| Layer      | Rule                                                    |
| ---------- | ------------------------------------------------------- |
| API Routes | Every org-scoped route requires membership verification |
| Services   | All service functions accept explicit organizationId    |
| Database   | All queries filter by organizationId                    |
| UI         | Organization selector persists active org in cookie     |
| Middleware | API routes without session are rejected                 |
