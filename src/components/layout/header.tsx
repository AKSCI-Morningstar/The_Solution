import { OrganizationSelector } from "@/features/organizations/components/organization-selector";

export function Header() {
  return (
    <header className="border-border bg-background flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <OrganizationSelector />
      </div>
      <div className="flex items-center gap-3">
        <div className="border-border bg-background text-muted-foreground flex h-8 w-56 items-center rounded-md border px-3 text-xs">
          Search...
        </div>
        <div className="bg-muted size-8 rounded-full" />
      </div>
    </header>
  );
}
