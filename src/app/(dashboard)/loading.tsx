import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardLoading() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 p-16"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">Loading workspace...</p>
    </div>
  );
}
