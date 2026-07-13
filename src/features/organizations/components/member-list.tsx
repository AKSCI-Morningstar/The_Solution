"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "./invite-member-dialog";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
}

interface MemberListProps {
  organizationId: string;
  members: Member[];
  currentUserId: string;
}

export function MemberList({ organizationId, members, currentUserId }: MemberListProps) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setRemoving(userId);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/members/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          Invite member
        </Button>
      </div>

      <div className="divide-border border-border divide-y rounded-lg border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full text-xs font-medium">
                {(member.name ?? member.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-sm font-medium">
                  {member.name ?? member.email}
                </span>
                <span className="text-muted-foreground text-xs">{member.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {member.role === "owner" ? (
                <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                  <Shield className="size-3" />
                  Owner
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Member</span>
              )}
              {member.role !== "owner" && member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  disabled={removing === member.userId}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-1"
                  title="Remove member"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <InviteMemberDialog
        organizationId={organizationId}
        open={showInvite}
        onOpenChange={setShowInvite}
      />
    </div>
  );
}
