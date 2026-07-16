import { NextRequest, NextResponse } from "next/server";
import { createDecision, getDecisions } from "@/server/decisions/decision-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    const data = await getDecisions(organizationId);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch decisions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.question || !body.question.trim()) {
      return NextResponse.json(
        { error: "Question is required to start a decision workflow" },
        { status: 400 },
      );
    }

    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    const newDecision = await createDecision({
      question: body.question,
      context: body.context,
      organizationId,
    });

    return NextResponse.json({ data: newDecision }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to create decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
