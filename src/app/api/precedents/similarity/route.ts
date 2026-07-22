import { NextRequest, NextResponse } from "next/server";
import { getPrecedentsBySimilarity } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization required" },
        { status: 401 },
      );
    }

    const matched = await getPrecedentsBySimilarity(organizationId, {
      question: body.question,
      componentName: body.componentName,
      suppliers: Array.isArray(body.suppliers) ? body.suppliers : [],
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      standards: Array.isArray(body.standards) ? body.standards : [],
      certifications: Array.isArray(body.certifications) ? body.certifications : [],
      documents: Array.isArray(body.documents) ? body.documents : [],
      contradictions: Array.isArray(body.contradictions) ? body.contradictions : [],
      missingEvidence: Array.isArray(body.missingEvidence) ? body.missingEvidence : [],
    });

    return NextResponse.json({ data: matched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate similarity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const question = searchParams.get("question") || undefined;
    const componentName = searchParams.get("componentName") || undefined;
    const suppliers = searchParams.get("suppliers")
      ? searchParams.get("suppliers")!.split(",")
      : undefined;
    const requirements = searchParams.get("requirements")
      ? searchParams.get("requirements")!.split(",")
      : undefined;
    const standards = searchParams.get("standards")
      ? searchParams.get("standards")!.split(",")
      : undefined;

    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization required" },
        { status: 401 },
      );
    }

    const matched = await getPrecedentsBySimilarity(organizationId, {
      question,
      componentName,
      suppliers,
      requirements,
      standards,
    });

    return NextResponse.json({ data: matched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch similarity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
