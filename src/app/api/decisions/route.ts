import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import { getDecisions, createDecision } from "@/server/decisions/decision-service";

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

    const decisions = await getDecisions(orgId);
    return NextResponse.json({ data: decisions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const body = await request.json();
    const { decisionType, description, rationale, supplierId, programId, reusableFor } = body;

    if (!decisionType || !description || !rationale) {
      return NextResponse.json({ error: "Missing required decision fields" }, { status: 400 });
    }

    const decision = await createDecision({
      organizationId: orgId,
      decisionType,
      description,
      rationale,
      proposedById: session.userId,
      supplierId,
      programId,
      reusableFor,
    });

    return NextResponse.json({ data: decision }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
