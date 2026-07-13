"use client";

import { useState, useEffect } from "react";
import { InvitationList } from "@/features/organizations/components";

interface Invitation {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  createdAt: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/invitations");
        if (res.ok) {
          const { data } = await res.json();
          if (!cancelled) setInvitations(data);
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
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground text-sm">
          Review and respond to organization invitations
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground text-sm">Loading invitations...</p>
        </div>
      ) : (
        <div className="max-w-xl">
          <InvitationList invitations={invitations} />
        </div>
      )}
    </div>
  );
}
