import { NextResponse } from "next/server";
import { getWorldModelAxioms, runSatSolver } from "@/server/worldmodel/worldmodel-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const axioms = await getWorldModelAxioms(orgId);
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
    const { axiomId } = body;
    if (!axiomId) return NextResponse.json({ error: "axiomId is required" }, { status: 400 });

    const updated = await runSatSolver(orgId, axiomId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
