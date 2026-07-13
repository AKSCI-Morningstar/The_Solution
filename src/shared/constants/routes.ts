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
} as const;

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export const SIDEBAR_NAV: SidebarNavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: "LayoutDashboard" },
  { label: "Documents", href: ROUTES.documents, icon: "FileText" },
  { label: "Knowledge Graph", href: ROUTES["knowledge-graph"], icon: "GitBranch" },
  { label: "Evidence", href: ROUTES.evidence, icon: "ShieldCheck" },
  { label: "Entities", href: ROUTES.entities, icon: "Tags" },
  { label: "Rules", href: ROUTES.rules, icon: "BookCheck" },
  { label: "Contradictions", href: ROUTES.contradictions, icon: "AlertTriangle" },
  { label: "Simulation", href: ROUTES.simulation, icon: "FlaskConical" },
  { label: "Suppliers", href: ROUTES.suppliers, icon: "Truck" },
  { label: "AI Workspace", href: ROUTES.ai, icon: "Brain" },
  { label: "Search", href: ROUTES.search, icon: "Search" },
  { label: "Reports", href: ROUTES.reports, icon: "BarChart3" },
  { label: "Notifications", href: ROUTES.notifications, icon: "Bell" },
  { label: "Organizations", href: ROUTES.organizations, icon: "Building2" },
  { label: "Settings", href: ROUTES.settings, icon: "Settings" },
];

export type RouteKey = keyof typeof ROUTES;
