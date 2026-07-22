import { NextResponse } from "next/server";
import {
  getSupplyChainReroutes,
  executeAutonomousRecovery,
} from "@/server/selfheal/selfheal-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const reroutes = await getSupplyChainReroutes(orgId);
    return NextResponse.json({ data: reroutes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { rerouteId } = body;
    if (!rerouteId) return NextResponse.json({ error: "rerouteId is required" }, { status: 400 });

    const updated = await executeAutonomousRecovery(orgId, rerouteId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
