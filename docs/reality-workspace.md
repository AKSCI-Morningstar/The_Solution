# Engineering Reality Workspace

## Overview

The Engineering Reality Workspace provides a UI for triggering and reviewing reality assessments. It is
accessible from the sidebar under "Reality Engine" in the Engineering section.

## Pages

### Assessment Dashboard

**Route:** `/reality`

- **Summary cards**: Verified / Contradicted / Needs review counts (current page).
- **Filters**: status, outcome, and a search box matching subject entity ID.
- **Table**: subject entity, status, current stage, outcome, duration, started-at.
- **Pagination**: 20 per page.
- **"New assessment"** entry point.

### New Assessment

**Route:** `/reality/new`

A single field: the ID of an already-completed `OrchestrationRun`. The form explains explicitly that
the Reality Engine reinterprets that run's outputs rather than re-executing the Rule or Contradiction
engines, and links to the Orchestrator workspace to find a completed run's ID.

### Assessment Detail

**Route:** `/reality/[assessmentId]`

- **Outcome banner**: the six-way outcome badge plus the deterministic `reasoning` string.
- **Assessment timeline**: all 8 stages in fixed order, each showing its latest logged status and
  duration - mirrors the Orchestrator's pipeline timeline UI for a consistent mental model across both
  workspaces.
- **Evidence card**: entities evaluated, supporting/missing/conflicting evidence counts.
- **Rules, contradictions, traceability card**: re-read rule count, currently-open contradiction count,
  traceability record count.
- **Ingestion completeness card**: jobs checked, pending, failed, and a complete yes/no summary - the
  Reality Engine's one integration point the Orchestrator does not check.
- **Execution card**: started/completed timestamps and total duration.
- **Cancel button**: shown only while `QUEUED` or `RUNNING`.
- Links back to the source Orchestration Run and forward to the full stage log page.

### Stage Logs

**Route:** `/reality/[assessmentId]/logs`

Full, paginated `RealityStageLog` table (stage, status, attempt, duration, start time, error) - useful
once an assessment has accumulated several retried attempts.

## Design

- Reuses the same UI primitives and semantic design tokens as every other workspace in this platform
  (`Card`, `Table`, `Badge`, `MetricCard`, `KeyValue`, `EmptyState`) - no new primitives were introduced.
- Responsive: single-column on mobile, multi-column summary cards on desktop.
- Loading and empty states on every list and detail view.
- Live polling (3s interval) on the detail page while an assessment is `QUEUED` or `RUNNING`.

## Navigation

- Sidebar: Engineering &rarr; Reality Engine
- Direct URL: `/reality`
- From an Orchestration Run's detail page: link forward to start (or find) a reality assessment for that
  run.
