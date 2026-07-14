import { NextResponse } from "next/server";
import { evaluateEvidence, evaluationInputSchema } from "@/server/evidence";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const body = await request.json();
    const parsed = evaluationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await evaluateEvidence(orgId, parsed.data.entityId, parsed.data.maxDepth);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
