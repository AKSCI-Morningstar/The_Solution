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
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: "LayoutDashboard",
  },
  {
    label: "Workspace",
    icon: "Layers",
    items: [
      { label: "Documents", href: ROUTES.documents, icon: "FileText" },
      { label: "Ingestion", href: ROUTES.ingestion, icon: "UploadCloud" },
      { label: "Search", href: ROUTES.search, icon: "Search" },
      { label: "Reports", href: ROUTES.reports, icon: "BarChart3" },
    ],
  },
  {
    label: "Engineering",
    icon: "Cog",
    items: [
      { label: "Entities", href: ROUTES.entities, icon: "Tags" },
      { label: "Knowledge Graph", href: ROUTES["knowledge-graph"], icon: "GitBranch" },
      { label: "Evidence", href: ROUTES.evidence, icon: "ShieldCheck" },
      { label: "Rules", href: ROUTES.rules, icon: "BookCheck" },
      { label: "Contradictions", href: ROUTES.contradictions, icon: "AlertTriangle" },
      { label: "Orchestrator", href: ROUTES.orchestrator, icon: "Workflow" },
      { label: "Simulation", href: ROUTES.simulation, icon: "FlaskConical" },
    ],
  },
  {
    label: "Supply Chain",
    icon: "Truck",
    items: [{ label: "Suppliers", href: ROUTES.suppliers, icon: "Truck" }],
  },
  {
    label: "Intelligence",
    icon: "Brain",
    items: [{ label: "AI Workspace", href: ROUTES.ai, icon: "Brain" }],
  },
  {
    label: "Administration",
    icon: "Settings",
    items: [
      { label: "Organizations", href: ROUTES.organizations, icon: "Building2" },
      { label: "Settings", href: ROUTES.settings, icon: "Settings" },
      { label: "Notifications", href: ROUTES.notifications, icon: "Bell" },
    ],
  },
];

export type RouteKey = keyof typeof ROUTES;
