"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, History, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "./type-badge";
import { StatusBadge } from "./status-badge";
import { EntityDetailSkeleton } from "./loading-state";
import { ErrorState } from "./error-state";

export interface Entity {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  entityType: string;
  status: string;
  version: string;
  tags: string[] | null;
  labels: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  updatedBy: { id: string; name: string | null; email: string } | null;
}

interface EntityDetailProps {
  entityId: string;
  onEdit?: (entity: Entity) => void;
  onDelete?: () => void;
}

export function EntityDetail({ entityId, onEdit, onDelete }: EntityDetailProps) {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setError("");
      try {
        const res = await fetch(`/api/engineering/entities/${entityId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/entities");
            return;
          }
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load");
          return;
        }
        const json = await res.json();
        if (!cancelled) setEntity(json.data);
      } catch {
        if (!cancelled) setError("Failed to load entity");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [entityId, router, reloadKey]);

  if (isLoading) return <EntityDetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (!entity) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/entities")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">{entity.name}</h1>
              <TypeBadge type={entity.entityType} size="md" />
              <StatusBadge status={entity.status} size="md" />
            </div>
            <p className="text-muted-foreground text-sm">
              {entity.identifier} &middot; v{entity.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(entity)}>
              <Edit3 className="mr-1.5 size-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 size-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {entity.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm leading-relaxed">{entity.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <History className="size-4" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Created</span>
                <span>{new Date(entity.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Updated</span>
                <span>{new Date(entity.updatedAt).toLocaleDateString()}</span>
              </div>
              {entity.createdBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs">Created by</span>
                  <span>{entity.createdBy.name ?? entity.createdBy.email}</span>
                </div>
              )}
              {entity.updatedBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs">Updated by</span>
                  <span>{entity.updatedBy.name ?? entity.updatedBy.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Share2 className="size-4" />
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`/entities/${entity.id}?tab=relationships`}
              className="text-primary text-sm hover:underline"
            >
              View relationships
            </a>
          </CardContent>
        </Card>
      </div>

      {entity.tags && entity.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground inline-flex rounded px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entity.labels && Object.keys(entity.labels).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(entity.labels).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground block text-xs">{key}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
