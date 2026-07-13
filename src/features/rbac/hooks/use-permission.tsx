"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface RoleInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

interface PermissionContextType {
  memberRole: string | null;
  organizationId: string | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  roles: RoleInfo[];
}

const PermissionContext = createContext<PermissionContextType>({
  memberRole: null,
  organizationId: null,
  isLoading: true,
  hasPermission: () => false,
  roles: [],
});

export function PermissionProvider({
  organizationId,
  memberRole,
  children,
}: {
  organizationId: string;
  memberRole: string;
  children: ReactNode;
}) {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    fetch(`/api/organizations/${organizationId}/roles`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        setRoles(json.data ?? []);
      })
      .catch(() => setRoles([]))
      .finally(() => setIsLoading(false));
  }, [organizationId]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      const role = roles.find((r) => r.slug === memberRole);
      if (!role) return false;
      return role.permissions.some((p) => {
        if (p === permission) return true;
        const [pResource, pAction] = p.split(":");
        const [rResource] = permission.split(":");
        return pResource === rResource && pAction === "*";
      });
    },
    [roles, memberRole],
  );

  return (
    <PermissionContext.Provider
      value={{ memberRole, organizationId, isLoading, hasPermission, roles }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
