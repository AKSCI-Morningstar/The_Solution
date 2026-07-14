"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Tags,
  UploadCloud,
  GitBranch,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageContainer, Section, Panel, GridLayout, Stack } from "@/components/layout";
import { MetricCard, LoadingSpinner, EmptyState } from "@/components/ui";
import { cn } from "@/shared/utils";

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  description: string;
  href: string;
  timestamp: string;
  actor?: string;
}

interface RecentEntity {
  id: string;
  name: string;
  entityType: string;
  identifier: string;
  status: string;
  updatedAt: string;
}

interface RecentDocument {
  id: string;
  fileName: string;
  status: string;
  fileExtension: string;
  createdAt: string;
}

interface OrgSummary {
  totalEntities: number;
  totalDocuments: number;
  totalRelationships: number;
  completedJobs: number;
}

const QUICK_ACTIONS = [
  { label: "Upload Document", href: "/ingestion/upload", icon: UploadCloud },
  { label: "New Entity", href: "/entities", icon: Tags },
  { label: "View Graph", href: "/knowledge-graph", icon: GitBranch },
  { label: "Search", href: "/search", icon: FileText },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  entity_created: Tags,
  entity_updated: Tags,
  document_uploaded: FileText,
  job_completed: UploadCloud,
  relationship_created: GitBranch,
};

export default function DashboardPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [orgSummary, setOrgSummary] = useState<OrgSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activityRes, entitiesRes, docsRes, summaryRes] = await Promise.all([
        fetch("/api/activity?limit=10"),
        fetch("/api/engineering/entities?limit=5"),
        fetch("/api/ingestion/documents?limit=5"),
        fetch("/api/dashboard/summary"),
      ]);

      if (activityRes.ok) {
        const json = await activityRes.json();
        setActivity(json.data ?? []);
      }
      if (entitiesRes.ok) {
        const json = await entitiesRes.json();
        setRecentEntities(json.data ?? []);
      }
      if (docsRes.ok) {
        const json = await docsRes.json();
        setRecentDocuments(json.data ?? []);
      }
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setOrgSummary(json.data ?? null);
      }
    } catch {
      // Silently handle — dashboard is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <PageContainer>
      <Stack gap={8}>
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Workspace Home</h1>
          <p className="text-muted-foreground text-sm">Engineering reality at a glance.</p>
        </div>

        <GridLayout columns={4} gap={4}>
          <MetricCard
            label="Entities"
            value={orgSummary?.totalEntities ?? "—"}
            icon={<Tags className="size-5" />}
          />
          <MetricCard
            label="Documents"
            value={orgSummary?.totalDocuments ?? "—"}
            icon={<FileText className="size-5" />}
          />
          <MetricCard
            label="Relationships"
            value={orgSummary?.totalRelationships ?? "—"}
            icon={<GitBranch className="size-5" />}
          />
          <MetricCard
            label="Jobs Completed"
            value={orgSummary?.completedJobs ?? "—"}
            icon={<ShieldCheck className="size-5" />}
          />
        </GridLayout>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "group border-border bg-background flex items-center gap-3 rounded-lg border p-4",
                "hover:bg-surface-hover transition-colors",
              )}
            >
              <div className="bg-muted text-muted-foreground group-hover:text-foreground flex size-9 items-center justify-center rounded-md">
                <action.icon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-sm font-medium">{action.label}</span>
              </div>
              <ArrowRight className="text-muted-foreground ml-auto size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Recent Documents">
            <Panel padding="none">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : recentDocuments.length === 0 ? (
                <EmptyState
                  icon={<FileText className="size-8" />}
                  title="No documents yet"
                  description="Upload engineering documents to get started."
                />
              ) : (
                <Stack gap={0}>
                  {recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/ingestion/documents/${doc.id}`}
                      className="border-border hover:bg-surface-hover flex items-center gap-3 border-b p-4 transition-colors last:border-b-0"
                    >
                      <FileText className="text-muted-foreground size-4" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-foreground truncate text-sm font-medium">
                          {doc.fileName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {doc.fileExtension.toUpperCase()} · {timeAgo(doc.createdAt)}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">{doc.status}</span>
                    </Link>
                  ))}
                </Stack>
              )}
            </Panel>
          </Section>

          <Section title="Recent Engineering Objects">
            <Panel padding="none">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : recentEntities.length === 0 ? (
                <EmptyState
                  icon={<Tags className="size-8" />}
                  title="No entities yet"
                  description="Create engineering entities to build your knowledge graph."
                />
              ) : (
                <Stack gap={0}>
                  {recentEntities.map((entity) => (
                    <Link
                      key={entity.id}
                      href={`/entities/${entity.id}`}
                      className="border-border hover:bg-surface-hover flex items-center gap-3 border-b p-4 transition-colors last:border-b-0"
                    >
                      <Tags className="text-muted-foreground size-4" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-foreground truncate text-sm font-medium">
                          {entity.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {entity.identifier} · {timeAgo(entity.updatedAt)}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">{entity.status}</span>
                    </Link>
                  ))}
                </Stack>
              )}
            </Panel>
          </Section>
        </div>

        <Section title="Recent Activity">
          <Panel padding="none">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : activity.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-8" />}
                title="No recent activity"
                description="Activity will appear here as you work."
              />
            ) : (
              <Stack gap={0}>
                {activity.map((item) => {
                  const Icon = ACTIVITY_ICONS[item.type] ?? Activity;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="border-border hover:bg-surface-hover flex items-center gap-3 border-b p-4 transition-colors last:border-b-0"
                    >
                      <div className="bg-muted flex size-8 items-center justify-center rounded-md">
                        <Icon className="text-muted-foreground size-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-foreground truncate text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground text-xs">{item.description}</span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        {item.actor && <span>{item.actor}</span>}
                        <Clock className="size-3" />
                        <span>{timeAgo(item.timestamp)}</span>
                      </div>
                    </Link>
                  );
                })}
              </Stack>
            )}
          </Panel>
        </Section>
      </Stack>
    </PageContainer>
  );
}
