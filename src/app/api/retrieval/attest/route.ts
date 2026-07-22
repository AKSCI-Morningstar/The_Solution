import { NextResponse } from "next/server";
import { attestLink, resolveConflict } from "@/server/retrieval/evidence-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { action, linkId, engineerName, notes, conflictId, resolutionNotes } = body;

    if (action === "attest" && linkId && engineerName) {
      const updated = await attestLink(orgId, linkId, engineerName, notes || "");
      return NextResponse.json({ data: updated });
    }

    if (action === "resolve" && conflictId && engineerName && resolutionNotes) {
      const updated = await resolveConflict(orgId, conflictId, engineerName, resolutionNotes);
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
