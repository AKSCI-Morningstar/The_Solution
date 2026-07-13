import { Breadcrumbs } from "@/components/layout";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">Engineering reality at a glance.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Status</h2>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">Operational</p>
        </div>
        <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Verifications</h2>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">0</p>
        </div>
        <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Evidence</h2>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">None yet</p>
        </div>
      </div>
    </div>
  );
}
