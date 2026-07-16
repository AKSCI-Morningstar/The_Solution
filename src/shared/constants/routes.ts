export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  documents: "/documents",
  "knowledge-graph": "/knowledge-graph",
  evidence: "/evidence",
  simulation: "/simulation",
  search: "/search",
  reports: "/reports",
  settings: "/settings",
  organizations: "/organizations",
  entities: "/entities",
  rules: "/rules",
  contradictions: "/contradictions",
  suppliers: "/suppliers",
  ai: "/ai",
  notifications: "/notifications",
  ingestion: "/ingestion",
  orchestrator: "/orchestrator",
  reality: "/reality",
  audit: "/audit",
  precedents: "/precedents",
} as const;

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface SidebarNavGroup {
  label: string;
  icon: string;
  items: SidebarNavItem[];
}

export type SidebarNavEntry = SidebarNavGroup | SidebarNavItem;

function isGroup(entry: SidebarNavEntry): entry is SidebarNavGroup {
  return (entry as SidebarNavGroup).items !== undefined;
}

export { isGroup };

export const SIDEBAR_NAV: SidebarNavEntry[] = [
  {
    label: "Workspace",
    href: ROUTES.dashboard,
    icon: "LayoutDashboard",
  },
  {
    label: "Engineering Data",
    icon: "Layers",
    items: [
      { label: "Documents", href: ROUTES.documents, icon: "FileText" },
      { label: "Suppliers", href: ROUTES.suppliers, icon: "Truck" },
    ],
  },
  {
    label: "Administration",
    icon: "Settings",
    items: [
      { label: "Settings", href: ROUTES.settings, icon: "Settings" },
      { label: "Audit Log", href: ROUTES.audit, icon: "ScrollText" },
      { label: "Notifications", href: ROUTES.notifications, icon: "Bell" },
    ],
  },
];

export type RouteKey = keyof typeof ROUTES;
