import { NextResponse } from "next/server";
import {
  getKnowledgeAxioms,
  publishAxiom,
  simulateZkExportClearance,
  getExportClearances,
} from "@/server/marketplace/ip-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "clearance") {
      const clearances = await getExportClearances(orgId);
      return NextResponse.json({ data: clearances });
    }

    const axioms = await getKnowledgeAxioms(orgId);
    return NextResponse.json({ data: axioms });
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
    const { action, title, description, axiomType, rulesApplied, componentId, clearanceType } =
      body;

    if (action === "publish") {
      if (!title || !description || !axiomType) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const axiom = await publishAxiom(orgId, title, description, axiomType, rulesApplied || {});
      return NextResponse.json({ data: axiom });
    }

    if (action === "clearance" && componentId && clearanceType) {
      const clearance = await simulateZkExportClearance(orgId, componentId, clearanceType);
      return NextResponse.json({ data: clearance });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
