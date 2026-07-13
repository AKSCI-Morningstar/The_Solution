"use client";

import { type ReactNode } from "react";
import { usePermission } from "../hooks/use-permission";

interface CanProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ permission, fallback = null, children }: CanProps) {
  const { hasPermission, isLoading } = usePermission();

  if (isLoading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
