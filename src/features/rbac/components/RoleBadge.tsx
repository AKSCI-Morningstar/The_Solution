interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 border-amber-300",
  admin: "bg-red-100 text-red-800 border-red-300",
  manager: "bg-blue-100 text-blue-800 border-blue-300",
  engineer: "bg-green-100 text-green-800 border-green-300",
  viewer: "bg-gray-100 text-gray-700 border-gray-300",
};

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const colorClass =
    ROLE_COLORS[role.toLowerCase()] ?? "bg-purple-100 text-purple-800 border-purple-300";
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
