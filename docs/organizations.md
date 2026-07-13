# Organizations Architecture

## Overview

The Morningstar Solution uses a multi-tenant architecture where all data is scoped to an organization. Every authenticated user must belong to at least one organization, and all operations are performed within the context of an active organization.

## Data Model

### Organization

| Field       | Type            | Description                 |
| ----------- | --------------- | --------------------------- |
| id          | cuid            | Primary key                 |
| name        | string          | Display name                |
| slug        | string (unique) | URL-friendly identifier     |
| description | string?         | Optional description        |
| logo        | string?         | Logo URL                    |
| metadata    | JSON            | Extensible metadata         |
| settings    | JSON            | Organization settings       |
| status      | string          | active, suspended, archived |
| ownerId     | string          | FK to User (creator/owner)  |
| createdAt   | DateTime        | Creation timestamp          |
| updatedAt   | DateTime        | Last update timestamp       |
| deletedAt   | DateTime?       | Soft delete                 |

### OrganizationMember

| Field          | Type      | Description            |
| -------------- | --------- | ---------------------- |
| id             | cuid      | Primary key            |
| organizationId | string    | FK to Organization     |
| userId         | string    | FK to User             |
| role           | string    | owner, member          |
| status         | string    | active, inactive       |
| invitedBy      | string?   | FK to User who invited |
| joinedAt       | DateTime? | When member joined     |

Unique constraint on `(organizationId, userId)`.

### Invitation

| Field          | Type            | Description                 |
| -------------- | --------------- | --------------------------- |
| id             | cuid            | Primary key                 |
| organizationId | string          | FK to Organization          |
| email          | string?         | Invited email               |
| userId         | string?         | FK to User (if user exists) |
| token          | string (unique) | Secure random token         |
| role           | string          | Role to assign              |
| status         | string          | pending, accepted, declined |
| invitedBy      | string          | FK to User who sent         |
| expiresAt      | DateTime        | 7-day expiry                |
| acceptedAt     | DateTime?       | When accepted               |
| declinedAt     | DateTime?       | When declined               |

## Organization Lifecycle

1. **Creation**: User creates an organization → becomes owner and first member → auto-switches to new org
2. **Configuration**: Owner can update name, description, and settings
3. **Growth**: Owner invites members via email → invitations sent with 7-day expiry
4. **Membership**: Invited users accept → become active members
5. **Departure**: Members can leave; owners must transfer ownership first
6. **Removal**: Owners can remove members; cannot remove themselves or other owners

## Organization Ownership

- The creator is the initial owner
- Ownership transfer is architecturally prepared but not yet implemented
- Only owners can:
  - Update organization settings
  - Invite new members
  - Remove existing members
