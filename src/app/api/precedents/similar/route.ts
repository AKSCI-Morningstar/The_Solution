import { NextRequest, NextResponse } from "next/server";
import { findSimilarPrecedents } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";

export async function POST(req: NextRequest) {
  try {
    const organizationId = await requireActiveOrganization();
    const body = await req.json();

    const context = {
      suppliers: body.suppliers || [],
      components: body.components || [],
      requirements: body.requirements || [],
      standards: body.standards || [],
      certifications: body.certifications || [],
      documents: body.documents || [],
      contradictions: body.contradictions || [],
      evidence: body.evidence || [],
      tags: body.tags || [],
      project: body.project,
      question: body.question,
    };

    const minScore = body.minScore ?? 0;
    const limit = body.limit ?? 10;

    const results = await findSimilarPrecedents(context, organizationId, minScore, limit);
    return NextResponse.json({ data: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to find similar precedents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
