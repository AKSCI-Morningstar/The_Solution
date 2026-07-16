import { NextRequest, NextResponse } from "next/server";
import {
  getDecisionById,
  updateDecision,
  finalizeDecision,
} from "@/server/decisions/decision-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    const data = await getDecisionById(id, organizationId);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    let organizationId: string | undefined;
    let userId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    let data;
    if (body.status === "FINALIZED") {
      if (!userId) {
        return NextResponse.json(
          { error: "User authentication required to finalize a decision" },
          { status: 401 },
        );
      }
      data = await finalizeDecision(id, organizationId, userId, body.finalDecision, body.rationale);
    } else {
      data = await updateDecision(id, organizationId, {
        status: body.status,
        subjectEntityId: body.subjectEntityId,
        supportingEvidence: body.supportingEvidence,
        contradictions: body.contradictions,
        unresolvedGaps: body.unresolvedGaps,
        precedents: body.precedents,
        finalDecision: body.finalDecision,
        rationale: body.rationale,
      });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to update decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
