import { NextResponse } from "next/server";
import { getCausalTwins, simulateFlightTwinWear } from "@/server/causal/twin-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const twins = await getCausalTwins(orgId);
    return NextResponse.json({ data: twins });
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
    const { twinId } = body;
    if (!twinId) return NextResponse.json({ error: "twinId is required" }, { status: 400 });

    const updated = await simulateFlightTwinWear(orgId, twinId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
