import { NextRequest, NextResponse } from "next/server";
import { getPrecedents, createPrecedent } from "@/server/precedents/precedent-service";
import { PrecedentType } from "@/features/precedents/types";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const system = searchParams.get("system") || undefined;

    // Retrieve active organization context, fallback gracefully if not active
    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback handled inside precedent service
    }

    const data = await getPrecedents({ search, type, system, organizationId });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch precedents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.title || !body.type || !body.description) {
      return NextResponse.json({ error: "Missing required fields (title, type, description)" }, { status: 400 });
    }

    let organizationId: string | undefined;
    let userId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback handled inside precedent service
    }

    const newPrec = await createPrecedent({
      title: body.title,
      type: body.type as PrecedentType,
      description: body.description,
      rootCause: body.rootCause || undefined,
      correctiveAction: body.correctiveAction || undefined,
      resolutionStatus: body.resolutionStatus || "RESOLVED",
      confidenceScore: parseFloat(body.confidenceScore) || 1.0,
      applicableSystems: Array.isArray(body.applicableSystems) ? body.applicableSystems : [body.applicableSystems || "General"],
      evidenceMetadata: body.evidenceMetadata || { documents: [], standards: [], testReports: [] },
      organizationId,
      userId
    });

    return NextResponse.json({ data: newPrec }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

