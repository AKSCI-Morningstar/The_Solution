# Workspace Overview

The Workspace is the primary user-facing interface of The Morningstar Solution. It integrates all platform capabilities into a single, cohesive experience.

## Pages

### Workspace Home (`/dashboard`)

The landing page after authentication. Provides:

- **Organization Summary**: Metric cards showing entity count, document count, relationship count, and completed ingestion jobs
- **Quick Actions**: Cards linking to Upload Document, New Entity, View Graph, and Search
- **Recent Documents**: Latest 5 uploaded documents with file type and timestamp
- **Recent Engineering Objects**: Latest 5 entities with identifier and status
- **Recent Activity**: Aggregated timeline of entity changes, document uploads, job completions, and relationship creations

Data is fetched in parallel from:

- `/api/dashboard/summary` — organization metrics
- `/api/activity?limit=10` — activity timeline
- `/api/engineering/entities?limit=5` — recent entities
- `/api/ingestion/documents?page=1&pageSize=5` — recent documents

### Engineering Entities (`/entities`)

Entity list with:

- Search by name, identifier, or description
- Filter by entity type and status
- Sortable columns (name, identifier, updated date)
- Bulk selection with delete action
- Pagination
- Click-through to entity detail pages

### Knowledge Graph (`/knowledge-graph`)

Interactive graph visualization with:

- Canvas-based node/edge rendering
- Zoom controls (wheel, +/- buttons, reset)
- Pan support (click and drag)
- Node selection with detail panel
- Edge selection with relationship details
- Legend showing active node types and edge types
- Mini-map with viewport indicator
- Toggle controls for legend and mini-map visibility

### Documents (`/documents`, `/ingestion`)

Document workspace including:

- Document list with search, pagination, status badges at `/documents`
- Upload workflow at `/ingestion/upload`
- Document detail with version history at `/ingestion/documents/[id]`
- Job tracking at `/ingestion/[jobId]` and pipeline dashboard at `/ingestion`

### Search (`/search`)

Full-page search experience with type filters and URL-synced query params. The command palette (Cmd/Ctrl+K) remains available from any page and links into the full search view.

### Settings (`/settings`)

Account profile readout, organization shortcuts, local theme preference, password reset entry, and sign-out.

### Audit Log (`/audit`)

Organization audit browser with filtering, pagination, and CSV export. Backed by `GET /api/audit` and `GET /api/audit/export`.

## API Endpoints

| Endpoint                            | Purpose                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `GET /api/search?q=&limit=&type=`   | Global search across entities, documents, organizations, users |
| `GET /api/activity?limit=`          | Recent activity timeline                                       |
| `GET /api/dashboard/summary`        | Organization summary metrics                                   |
| `GET /api/engineering/entities`     | Entity list with filtering, sorting, pagination                |
| `GET /api/engineering/types`        | Entity types and statuses for filters                          |
| `GET /api/ingestion/documents`      | Document list with filtering                                   |
| `GET /api/knowledge-graph/subgraph` | Graph nodes and edges                                          |
| `GET /api/audit`                    | Organization audit log with filters and pagination             |
| `GET /api/audit/export`             | CSV export of filtered audit events                            |

## Design Tokens

The workspace uses a consistent set of semantic design tokens throughout:

| Token                    | Usage                                 |
| ------------------------ | ------------------------------------- |
| `bg-background`          | Page and panel backgrounds            |
| `bg-sidebar`             | Sidebar background                    |
| `bg-muted`               | Subtle backgrounds, icon containers   |
| `bg-sidebar-active`      | Active nav item                       |
| `hover:bg-surface-hover` | Hover states for interactive elements |
| `text-foreground`        | Primary text                          |
| `text-muted-foreground`  | Secondary text, labels, hints         |
| `border-border`          | Borders on panels, dividers, inputs   |

## Future Enhancements

- Semantic search integration (vector embeddings)
- Pinned items on workspace home
- System status indicators
- Future tasks placeholder
- Full-text document search
- Advanced graph layout algorithms (force-directed, hierarchical)
