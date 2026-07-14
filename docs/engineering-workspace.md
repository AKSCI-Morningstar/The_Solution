# Engineering Workspace

The Engineering Workspace is the integrated user experience layer of The Morningstar Solution. It unifies navigation, search, activity tracking, and the core engineering domains (entities, documents, knowledge graph) into a single cohesive platform.

## Architecture

The workspace is composed of the following integrated systems:

### Navigation

- **Grouped sidebar** with collapsible sections (Workspace, Engineering, Supply Chain, Intelligence, Administration)
- **Dynamic breadcrumbs** generated from the current route
- **Keyboard navigation** for sidebar items (Arrow Up/Down, Home/End)
- See [Navigation](./navigation.md) for details

### Global Search

- **Command palette** triggered via Cmd/Ctrl+K or the search button in the header
- Searches engineering entities, documents, organizations, and users
- Debounced API calls (200ms) to `/api/search`
- Architecture supports future semantic search by extending the API endpoint
- Component: `src/features/search/components/search-command-palette.tsx`
- API: `src/app/api/search/route.ts`

### Activity Timeline

- Aggregates recent activity from entities, documents, ingestion jobs, and relationships
- Uses existing Prisma models (no new audit infrastructure needed)
- API: `src/app/api/activity/route.ts`
- Displayed on the workspace home page

### Workspace Home

- Dashboard page transformed into a workspace home with:
  - Organization summary metrics (entities, documents, relationships, completed jobs)
  - Quick action cards (upload, new entity, view graph, search)
  - Recent documents list
  - Recent engineering entities list
  - Recent activity timeline
- API: `src/app/api/dashboard/summary/route.ts`

## Key Files

| Component | Path |
|-----------|------|
| Sidebar | `src/components/layout/sidebar.tsx` |
| Header | `src/components/layout/header.tsx` |
| Shell | `src/components/layout/shell.tsx` |
| Search Palette | `src/features/search/components/search-command-palette.tsx` |
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| Entity List | `src/features/engineering/components/entity-list.tsx` |
| Graph Viewer | `src/features/knowledge-graph/components/graph-viewer.tsx` |
| Search API | `src/app/api/search/route.ts` |
| Activity API | `src/app/api/activity/route.ts` |
| Summary API | `src/app/api/dashboard/summary/route.ts` |

## Design System

All workspace components use semantic design tokens:

- `bg-sidebar`, `bg-background`, `bg-muted` for backgrounds
- `text-foreground`, `text-muted-foreground` for text
- `border-border` for borders
- `bg-sidebar-active`, `hover:bg-surface-hover` for interactive states

No hardcoded colors (`bg-white`, `text-gray-*`) are used in workspace components.

## Performance

- Search palette uses debounced fetching (200ms delay)
- Dashboard loads data in parallel via `Promise.all`
- Graph viewer uses `useMemo` for position calculations
- Canvas rendering uses `devicePixelRatio` for crisp display
- ResizeObserver for responsive canvas sizing
