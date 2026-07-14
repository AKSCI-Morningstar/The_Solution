import { NextResponse } from "next/server";
import {
  getContradiction,
  updateContradictionStatus,
  updateContradictionStatusSchema,
} from "@/server/contradictions";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const { id } = await params;
    const url = new URL(request.url);

    if (url.searchParams.get("evidence") === "true") {
      const { getContradictionEvidence } = await import("@/server/contradictions");
      const evidence = await getContradictionEvidence(id, orgId);
      return NextResponse.json({ data: evidence });
    }

    if (url.searchParams.get("traceability") === "true") {
      const { getContradictionTraceability } = await import("@/server/contradictions");
      const traceability = await getContradictionTraceability(id, orgId);
      return NextResponse.json({ data: traceability });
    }

    const contradiction = await getContradiction(id, orgId);
    return NextResponse.json({ data: contradiction });
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateContradictionStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await updateContradictionStatus(
      id,
      orgId,
      parsed.data.status,
      user.id,
      parsed.data.resolutionNotes,
    );
    return NextResponse.json({ data: updated });
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
