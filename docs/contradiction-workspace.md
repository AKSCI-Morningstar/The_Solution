# Contradiction Workspace

## Overview

The Contradiction Workspace provides a comprehensive UI for reviewing, classifying, and resolving engineering contradictions detected by the Deterministic Contradiction Engine. It is accessible from the sidebar under "Contradictions" in the Engineering section.

## Pages

### Contradiction List Page

**Route:** `/contradictions`

Displays all contradictions for the active organization with:

- **Summary Cards**: Total, Critical, Unresolved, By Type counts
- **Filters**: Filter by type, severity, status, and text search
- **Sortable Table**: Sort by detected date, severity, or type
- **Pagination**: 20 items per page with page controls
- **Status Badges**: Color-coded by lifecycle status (blue=Detected, amber=Under Review, green=Accepted, red=Rejected, emerald=Resolved, gray=Archived)
- **Severity Badges**: Color-coded by severity level (red=Critical, orange=High, amber=Medium, blue=Low)

### Contradiction Detail Page

**Route:** `/contradictions/[id]`

Shows full contradiction detail with 4 tabs:

#### 1. Evidence Tab

Displays supporting and conflicting evidence side-by-side:

- **Supporting Evidence**: Evidence nodes with status ACTIVE or APPROVED
- **Conflicting Evidence**: All other evidence nodes involved
- Each evidence card shows: label, entity type, status, version, document provenance, page/section, extraction method

#### 2. Traceability Tab

Shows the full provenance chain for the contradiction:

- Entity name, type, identifier, version, status
- Document source (document name, version, page, section)
- Relationship path (edge types traversed)
- Extraction method
- Timestamp

#### 3. Affected Entities Tab

Lists all entities impacted by the contradiction:

- Entity name, type, identifier
- Relationship to the contradiction (e.g., "directly_involved")

#### 4. Lifecycle Tab

Shows the full audit trail of lifecycle transitions:

- Action taken (DETECTED, REVIEW_STARTED, ACCEPTED, REJECTED, RESOLVED, ARCHIVED, REOPENED)
- From status → To status
- Who performed the action
- When
- Metadata

### Status Update

From the detail page, users can update the contradiction status:

1. Select a new status from the dropdown (only valid transitions are shown)
2. Optionally add resolution notes (max 5000 characters)
3. Submit to transition the lifecycle

The UI prevents invalid transitions client-side and the API validates server-side.

## Design

- Uses semantic design tokens (`bg-background`, `text-foreground`, `border-border`)
- Color-coded badges for severity and status
- Responsive layout (stacks on mobile, side-by-side on desktop)
- Loading and empty states for all views
- Keyboard-navigable tabs and controls

## Navigation

- Sidebar: Engineering → Contradictions
- Direct URL: `/contradictions`
- From entity detail: contradictions referencing the entity link to the list filtered by entityId
