import { STATUS_COLORS, STATUS_LABELS } from "@/server/engineering/constants";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] ?? status;
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
