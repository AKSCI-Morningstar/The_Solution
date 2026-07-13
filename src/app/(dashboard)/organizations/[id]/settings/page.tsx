"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizationSettingsForm, MemberList } from "@/features/organizations/components";

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  role: string;
}

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
}

export default function OrganizationSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [orgRes, membersRes] = await Promise.all([
          fetch(`/api/organizations/${params.id}`),
          fetch(`/api/organizations/${params.id}/members`),
        ]);

        if (!orgRes.ok) {
          if (!cancelled) router.push("/organizations");
          return;
        }

        const orgData = await orgRes.json();
        if (!cancelled) setOrg(orgData.data);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (!cancelled) setMembers(membersData.data);
        }
      } catch {
        if (!cancelled) router.push("/organizations");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!org) return null;

  const isOwner = org.role === "owner";

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">{org.name}</h1>
        <p className="text-muted-foreground text-sm">
          {org.description ?? "Manage organization settings"}
        </p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="border-border flex gap-4 border-b">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Members ({org.memberCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6 max-w-lg">
          {isOwner ? (
            <OrganizationSettingsForm organization={org} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Only organization owners can edit settings.
            </p>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6 max-w-xl">
          <MemberList organizationId={org.id} members={members} currentUserId="" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
