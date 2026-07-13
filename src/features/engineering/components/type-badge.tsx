import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from "@/server/engineering/constants";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const colorClass = ENTITY_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700";
  const label = ENTITY_TYPE_LABELS[type] ?? type;
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
