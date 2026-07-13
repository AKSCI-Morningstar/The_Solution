"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Users, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationDialog } from "@/features/organizations/components";

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  memberCount: number;
  role: string;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const { data } = await res.json();
          if (!cancelled) setOrgs(data);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground text-sm">Manage your teams and workspaces</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 size-4" />
          Create organization
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground text-sm">Loading organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <Building2 className="text-muted-foreground mb-4 size-12" />
          <h3 className="text-foreground mb-1 text-lg font-medium">No organizations yet</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Create your first organization to get started
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 size-4" />
            Create organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => router.push(`/organizations/${org.id}/settings`)}
              className="group text-left"
            >
              <Card className="hover:bg-surface-hover transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="flex items-center gap-2">{org.name}</CardTitle>
                      <CardDescription>{org.description ?? "No description"}</CardDescription>
                    </div>
                    <ChevronRight className="text-muted-foreground mt-1 size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span className="capitalize">{org.role}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <CreateOrganizationDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
