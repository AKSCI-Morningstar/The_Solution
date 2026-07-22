import { NextResponse } from "next/server";
import {
  getSupplyChainRisks,
  simulateSupplyChainRisks,
  triggerMitigation,
} from "@/server/risk/clearinghouse-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const risks = await getSupplyChainRisks(orgId);
    return NextResponse.json({ data: risks });
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
    const { action, riskId } = body;

    if (action === "simulate") {
      const data = await simulateSupplyChainRisks(orgId);
      return NextResponse.json({ data });
    }

    if (action === "mitigate" && riskId) {
      const updated = await triggerMitigation(orgId, riskId);
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
