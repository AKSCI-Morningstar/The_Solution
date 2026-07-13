"use client";

import { SIDEBAR_NAV } from "@/shared/constants";
import { cn } from "@/shared/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white lg:block dark:border-white/10 dark:bg-black">
      <div className="flex h-full flex-col gap-1 overflow-y-auto p-4">
        <Link
          href="/"
          className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold text-black dark:text-zinc-50"
        >
          <span className="size-6 rounded bg-black dark:bg-white" />
          Morningstar
        </Link>
        <nav className="flex flex-col gap-1">
          {SIDEBAR_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-black/5 font-medium text-black dark:bg-white/10 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-black/5 hover:text-black dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50",
                )}
              >
                <span className="size-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
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
