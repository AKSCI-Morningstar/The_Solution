"use client";

import { usePermission } from "../hooks/use-permission";
import { DEFAULT_ROLES } from "@/server/rbac/permissions";

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled = false }: RoleSelectorProps) {
  const { hasPermission } = usePermission();
  const canAssignRoles = hasPermission("roles:assign");
  const canManageRoles = hasPermission("roles:manage");

  const allowedRoles = DEFAULT_ROLES.filter((role) => {
    if (role.slug === "owner") return false;
    return canManageRoles || role.slug === "member" || role.slug === "viewer";
  });

  const isDisabled = disabled || (!canAssignRoles && !canManageRoles);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {allowedRoles.map((role) => (
        <option key={role.slug} value={role.slug}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
