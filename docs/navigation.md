# Navigation

The navigation system provides unified access to all areas of the Engineering Workspace.

## Sidebar

The sidebar is a client component (`src/components/layout/sidebar.tsx`) that renders grouped navigation with collapsible sections.

### Structure

Navigation is defined in `src/shared/constants/routes.ts` as `SIDEBAR_NAV`, an array of `SidebarNavEntry` items. Each entry is either a flat item or a group:

```typescript
interface SidebarNavItem {
  label: string;
  href: string;
  icon: string;      // Lucide icon name
  badge?: number;    // Optional badge count
}

interface SidebarNavGroup {
  label: string;
  icon: string;
  items: SidebarNavItem[];
}

type SidebarNavEntry = SidebarNavGroup | SidebarNavItem;
```

### Groups

| Group | Items |
|-------|-------|
| Dashboard | (flat item, no group) |
| Workspace | Documents, Ingestion, Search, Reports |
| Engineering | Entities, Knowledge Graph, Evidence, Rules, Contradictions, Simulation |
| Supply Chain | Suppliers |
| Intelligence | AI Workspace |
| Administration | Organizations, Settings, Notifications |

### Features

- **Collapsible groups**: Click group header to expand/collapse
- **Auto-expand**: Groups with an active child auto-expand on mount and route change
- **Keyboard navigation**: Arrow Up/Down to move between items, Home/End to jump to first/last
- **Active state**: Current route is highlighted; parent group shows active indicator
- **Responsive**: Hidden on screens below `lg` breakpoint (`w-64` fixed width on desktop)
- **Icon mapping**: 18 Lucide icons mapped via `iconMap` in the sidebar component

### Type Guard

The `isGroup` function in `routes.ts` distinguishes groups from flat items:

```typescript
function isGroup(entry: SidebarNavEntry): entry is SidebarNavGroup {
  return (entry as SidebarNavGroup).items !== undefined;
}
```

## Header

The header (`src/components/layout/header.tsx`) is a client component that provides:

### Breadcrumbs

- Dynamically generated from the current pathname using `ROUTE_LABELS` map
- Dashboard is always the root breadcrumb
- Last segment has no link (current page)
- Uses the `Breadcrumbs` layout component wrapping the `Breadcrumb` UI component

### Global Search Trigger

- Search button in the header dispatches a `CustomEvent` named `morningstar:open-search`
- The `SearchCommandPalette` listens for this event and opens
- Keyboard shortcut: Cmd/Ctrl+K
- This decouples the header from the search palette component

## Shell

The `Shell` component (`src/components/layout/shell.tsx`) composes:

```
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex flex-1 flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
  <SearchCommandPalette />
</div>
```

The search palette is globally mounted at the shell level, making it available on every dashboard page.
