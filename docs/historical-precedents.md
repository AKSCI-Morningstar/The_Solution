# Historical Precedents: Organizational Memory

## Architecture

Historical Precedents integrate directly into the Morningstar Solution's existing architecture as a first-class capability, not a separate module. The system captures, stores, and surfaces relevant prior engineering work whenever it helps answer an engineering question.

```
src/
  server/
    precedents/
      index.ts              # Barrel exports
      precedent-service.ts  # CRUD, search, filtering, pagination
      similarity-engine.ts  # Deterministic similarity matching
      auto-precedent.ts     # Automatic precedent creation
  features/
    precedents/
      types.ts              # Full data model types
  app/
    api/
      precedents/
        route.ts            # GET (list/search), POST (create)
        [id]/route.ts       # GET, PUT, DELETE
        [id]/versions/route.ts  # GET version history
        similar/route.ts    # POST similarity matching
        from-decision/route.ts  # POST auto-create from decisions
        systems/route.ts    # GET (legacy - unique systems)
    (dashboard)/
      dashboard/page.tsx    # Related Historical Context section
      precedents/page.tsx   # Full precedent explorer
  prisma/
    schema.prisma           # Precedent + PrecedentVersion models
tests/
  unit/
    precedents/
      similarity-engine.test.ts  # 21 tests
```

## Data Model

### Precedent

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| organizationId | String | Multi-tenant isolation |
| title | String | Precedent title |
| summary | String? | Brief description |
| engineeringQuestion | String? | The question that drove the decision |
| decisionMade | String? | What was decided |
| supportingEvidence | String[] (JSON) | Evidence items that supported the decision |
| contradictions | String[] (JSON) | Contradictions encountered |
| missingEvidence | String[] (JSON) | Evidence that was absent |
| outcome | String? | Final result |
| lessonsLearned | String[] (JSON) | Key takeaways |
| relatedProjects | String[] (JSON) | Associated projects |
| relatedSuppliers | String[] (JSON) | Suppliers involved |
| relatedRequirements | String[] (JSON) | Requirements referenced |
| relatedDocuments | String[] (JSON) | Documents cited |
| relatedComponents | String[] (JSON) | Components affected |
| relatedStandards | String[] (JSON) | Standards applied |
| relatedCertifications | String[] (JSON) | Certifications required |
| decisionDate | DateTime? | When the decision was made |
| decisionOwner | String? | Who made the decision |
| confidence | Float | 0.0 - 1.0 confidence score |
| tags | String[] (JSON) | User-defined tags |
| version | Int | Auto-incrementing version |
| sourceEntityId | String? | Link to engineering entity |
| sourceAssessmentId | String? | Link to assessment |
| createdById | String? | Who created it |
| deletedAt | DateTime? | Soft delete |

### PrecedentVersion

Each update creates a new version entry with a full snapshot of the record, enabling complete audit history.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/precedents | List/search precedents with pagination and filters |
| POST | /api/precedents | Create a new precedent |
| GET | /api/precedents/[id] | Get precedent with version history |
| PUT | /api/precedents/[id] | Update a precedent (creates version) |
| DELETE | /api/precedents/[id] | Soft-delete a precedent |
| GET | /api/precedents/[id]/versions | Get version history for a precedent |
| POST | /api/precedents/similar | Find similar precedents by context |
| POST | /api/precedents/from-decision | Auto-create precedent from decision data |

### Filter Parameters (GET /api/precedents)

- `search` - Full-text search across title, summary, question, decision, outcome, tags
- `supplier` - Filter by supplier name
- `requirement` - Filter by requirement
- `component` - Filter by component
- `project` - Filter by project
- `certification` - Filter by certification
- `standard` - Filter by standard
- `decisionOwner` - Filter by owner
- `tags` - Comma-separated tag filter
- `dateFrom`/`dateTo` - Date range filter on decisionDate
- `confidenceMin`/`confidenceMax` - Confidence range filter
- `page`/`pageSize` - Pagination (default: page=1, pageSize=20)
- `sortBy`/`sortOrder` - Sorting (title, decisionDate, confidence, createdAt, decisionOwner)

## Similarity Methodology

The similarity engine uses deterministic, explainable matching based on overlapping attributes. It does NOT depend on any AI provider.

### Weights

| Attribute | Weight | Description |
|-----------|--------|-------------|
| Supplier | 20 | Same supplier name |
| Component | 18 | Same component name |
| Requirement | 16 | Same requirement reference |
| Standard | 14 | Same standard |
| Certification | 12 | Same certification |
| Document | 10 | Same document reference |
| Contradiction | 8 | Similar contradiction pattern |
| Evidence | 8 | Shared supporting evidence |
| Tags | 6 | Matching tags |
| Project | 4 | Related to same project |
| Question | 4 | Token overlap with question/title/summary |

### Score Calculation

1. For each attribute present in the match context, compute Jaccard/overlap similarity against the precedent's corresponding field
2. Multiply by weight, sum to total
3. Normalize by dividing by maximum possible score

### Explainability

Every match returns a list of human-readable reasons:
- "Same supplier: Alpha Bolt"
- "Same standard: ISO 898"
- "Matches question terms: cracking, fatigue"
- "Similar contradiction pattern"

## Workspace Integration

### Related Historical Context Section

Located in the main Verification Workspace (`/dashboard`), this section appears after evidence evaluation completes. It:

1. Sends the current question + entity context to POST /api/precedents/similar
2. Displays matched precedents sorted by similarity score
3. Shows a similarity score bar for each match
4. Lists match reasons as tags
5. Displays key details: outcome, lessons learned, decision made
6. Links to the full Precedent Explorer at `/precedents`

### Save as Precedent

A "Save as Precedent" button in the decision export panel allows engineers to explicitly capture the current assessment as a precedent. This calls POST /api/precedents/from-decision with the evaluated evidence, contradictions, and outcome.

## Operational Flow

1. **Engineer asks a question** in the Verification Workspace
2. **Evidence evaluation** runs against the entity
3. **Similarity matching** queries precedents using the question + entity context
4. **Related Historical Context** section displays matching precedents
5. **Engineer reviews** matches, expands details, and learns from past decisions
6. **Export or Save** - engineer can save the current decision as a new precedent

## Automatic Precedent Creation

- When an engineer clicks "Save as Precedent" in the dashboard, the current assessment context is automatically captured
- Duplicate detection prevents creating multiple precedents for the same source entity
- Each update creates a new version in the PrecedentVersion table
- The `auto-precedent.ts` service can be called from the orchestrator pipeline for fully automatic capture

## Testing

### Unit Tests (21 tests - all passing)

- `computeSimilarity` with empty context returns 0
- Supplier matching
- Component matching
- Standard matching
- Certification matching
- Contradiction matching
- Evidence matching
- Tag matching
- Project matching
- Question/title token matching
- Question/summary token matching
- Requirement matching
- Document matching
- Multi-attribute accumulation
- Case insensitivity
- `matchPrecedents` result sorting
- `matchPrecedents` multiple matches
- `matchPrecedents` minScore filtering
- `matchPrecedents` limit parameter
- `matchPrecedents` matchReasons inclusion
- `matchPrecedents` empty context

## Multi-Tenancy

All precedent operations are scoped by `organizationId`. The API uses `requireActiveOrganization()` to enforce organization isolation. The Prisma model includes composite indexes on `[organizationId]` and `[organizationId, title]` for efficient filtered queries.

## Performance

- Pagination with skip/take (default pageSize=20, max=100)
- Composite indexes on organizationId + filterable fields
- Soft delete pattern (deletedAt) for recoverability
- Max 200 records loaded for similarity matching (paginated)
- No N+1 queries in list/get operations
- PrecedentVersion snapshots use JSON serialization for efficient storage
