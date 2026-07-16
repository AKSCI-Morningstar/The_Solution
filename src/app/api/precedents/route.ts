import { NextRequest, NextResponse } from "next/server";
import { getPrecedents, createPrecedent } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const system = searchParams.get("system") || undefined;

    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
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

    if (!body.title || !body.summary || !body.engineeringQuestion || !body.decisionMade) {
      return NextResponse.json(
        { error: "Missing required fields (title, summary, engineeringQuestion, decisionMade)" },
        { status: 400 },
      );
    }

    let organizationId: string | undefined;
    let userId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback
    }

    const newPrec = await createPrecedent({
      title: body.title,
      summary: body.summary,
      engineeringQuestion: body.engineeringQuestion,
      decisionMade: body.decisionMade,
      outcome: body.outcome || "Pending outcome verification",
      lessonsLearned: body.lessonsLearned || "None recorded",
      confidence: parseFloat(body.confidence) || 1.0,
      tags: Array.isArray(body.tags) ? body.tags : [],
      relatedProjects: Array.isArray(body.relatedProjects) ? body.relatedProjects : [],
      relatedSuppliers: Array.isArray(body.relatedSuppliers) ? body.relatedSuppliers : [],
      relatedRequirements: Array.isArray(body.relatedRequirements) ? body.relatedRequirements : [],
      relatedDocuments: Array.isArray(body.relatedDocuments) ? body.relatedDocuments : [],
      relatedComponents: Array.isArray(body.relatedComponents) ? body.relatedComponents : [],
      relatedStandards: Array.isArray(body.relatedStandards) ? body.relatedStandards : [],
      relatedCertifications: Array.isArray(body.relatedCertifications)
        ? body.relatedCertifications
        : [],
      supportingEvidence: body.supportingEvidence || [],
      contradictions: body.contradictions || [],
      missingEvidence: body.missingEvidence || [],
      organizationId,
      userId,
    });

    return NextResponse.json({ data: newPrec }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
