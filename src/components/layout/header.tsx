"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { OrganizationSelector } from "@/features/organizations/components/organization-selector";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Search } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  ingestion: "Ingestion",
  "knowledge-graph": "Knowledge Graph",
  evidence: "Evidence",
  entities: "Entities",
  rules: "Rules",
  contradictions: "Contradictions",
  simulation: "Simulation",
  suppliers: "Suppliers",
  ai: "AI Workspace",
  search: "Search",
  reports: "Reports",
  notifications: "Notifications",
  organizations: "Organizations",
  settings: "Settings",
};

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Dashboard" }];

  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }];
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = ROUTE_LABELS[segment] ?? segment;
    const isLast = segment === segments[segments.length - 1];
    items.push({ label, ...(isLast ? {} : { href: path }) });
  }
  return items;
}

function openSearchPalette() {
  window.dispatchEvent(new CustomEvent("morningstar:open-search"));
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearchPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="border-border bg-background sticky top-0 z-30 flex h-14 flex-col justify-center gap-0 border-b px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <OrganizationSelector />
          <div className="border-border hidden items-center md:flex">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openSearchPalette}
            className="border-border bg-background text-muted-foreground hover:bg-surface-hover flex h-8 w-48 items-center gap-2 rounded-md border px-3 text-xs transition-colors lg:w-56"
            aria-label="Search"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-muted-foreground/70 hidden rounded border border-current/20 px-1 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="bg-muted size-8 rounded-full" />
        </div>
      </div>
    </header>
  );
}
