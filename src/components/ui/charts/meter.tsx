"use client";

/**
 * A percentage meter for a single KPI - the fill carries severity (good ≥
 * `goodThreshold`, warning ≥ `warningThreshold`, otherwise critical), the
 * unfilled track stays a neutral, muted step so the state reads across the
 * whole bar without a second color competing with it.
 */
export function Meter({
  label,
  valuePercent,
  goodThreshold = 90,
  warningThreshold = 70,
}: {
  label: string;
  valuePercent: number;
  goodThreshold?: number;
  warningThreshold?: number;
}) {
  const clamped = Math.min(100, Math.max(0, valuePercent));
  const variant =
    clamped >= goodThreshold ? "success" : clamped >= warningThreshold ? "warning" : "destructive";
  const fillClass =
    variant === "success" ? "bg-success" : variant === "warning" ? "bg-warning" : "bg-destructive";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className="text-foreground text-sm font-semibold tabular-nums">
          {clamped.toFixed(1)}%
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}
