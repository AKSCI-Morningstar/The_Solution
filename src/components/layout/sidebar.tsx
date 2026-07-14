"use client";

import { SIDEBAR_NAV } from "@/shared/constants";
import { cn } from "@/shared/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  GitBranch,
  ShieldCheck,
  Tags,
  BookCheck,
  AlertTriangle,
  FlaskConical,
  Truck,
  Brain,
  Search,
  BarChart3,
  Bell,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  UploadCloud,
  GitBranch,
  ShieldCheck,
  Tags,
  BookCheck,
  AlertTriangle,
  FlaskConical,
  Truck,
  Brain,
  Search,
  BarChart3,
  Bell,
  Building2,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-sidebar hidden w-64 shrink-0 border-r lg:block">
      <div className="flex h-full flex-col gap-1 overflow-y-auto p-4">
        <Link
          href="/"
          className="text-foreground mb-4 flex items-center gap-2 px-2 text-sm font-semibold"
        >
          <span className="bg-foreground size-6 rounded" />
          Morningstar
        </Link>
        <nav className="flex flex-col gap-1">
          {SIDEBAR_NAV.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-active text-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-foreground/10 ml-auto rounded-full px-2 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
