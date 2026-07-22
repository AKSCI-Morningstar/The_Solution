import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import { getSuppliersAtRisk } from "@/server/intelligence/supplier-risk-predictor";

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const data = await getSuppliersAtRisk(orgId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
