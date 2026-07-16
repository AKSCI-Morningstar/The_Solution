import { NextRequest, NextResponse } from "next/server";
import { autoCreatePrecedent } from "@/server/precedents/auto-precedent";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function POST(req: NextRequest) {
  try {
    const organizationId = await requireActiveOrganization();
    const user = await getCurrentUser();
    const body = await req.json();

    await autoCreatePrecedent({
      organizationId,
      userId: user?.id,
      question: body.question,
      entityId: body.entityId,
      entityName: body.entityName,
      entityType: body.entityType,
      decision: body.decision,
      outcome: body.outcome,
      supportingEvidence: body.supportingEvidence,
      contradictions: body.contradictions,
      missingEvidence: body.missingEvidence,
      suppliers: body.suppliers,
      components: body.components,
      standards: body.standards,
      certifications: body.certifications,
      requirements: body.requirements,
      documents: body.documents,
      tags: body.tags,
      confidence: body.confidence,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create precedent from decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
