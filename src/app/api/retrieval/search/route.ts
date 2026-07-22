import { NextResponse } from "next/server";
import {
  getHumanRecords,
  getProposedLinks,
  getConflictLogs,
  getValidationMilestones,
} from "@/server/retrieval/evidence-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (scope === "conflicts") {
      const conflicts = await getConflictLogs(orgId);
      return NextResponse.json({ data: conflicts });
    }

    if (scope === "milestones") {
      const milestones = await getValidationMilestones(orgId);
      return NextResponse.json({ data: milestones });
    }

    const records = await getHumanRecords(orgId);
    const links = await getProposedLinks(orgId);

    return NextResponse.json({
      data: {
        records,
        links,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
