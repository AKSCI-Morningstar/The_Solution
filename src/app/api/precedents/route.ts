/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPrecedents, createPrecedent } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac";
import { AppError } from "@/shared/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const system = searchParams.get("system") || undefined;
    const supplier = searchParams.get("supplier") || undefined;
    const requirement = searchParams.get("requirement") || undefined;
    const component = searchParams.get("component") || undefined;
    const project = searchParams.get("project") || undefined;
    const certification = searchParams.get("certification") || undefined;
    const standard = searchParams.get("standard") || undefined;
    const owner = searchParams.get("owner") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const tags = searchParams.get("tags") || undefined;

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!, 10)
      : undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    await requirePermission(organizationId, user.id, "precedents:read");

    const result = await getPrecedents({
      search,
      type,
      system,
      supplier,
      requirement,
      component,
      project,
      certification,
      standard,
      owner,
      dateFrom,
      dateTo,
      tags,
      page,
      pageSize,
      sortBy,
      sortOrder,
      organizationId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
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
    let user: any;
    try {
      organizationId = await requireActiveOrganization();
      user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 });
    }

    if (!user || !userId) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    await requirePermission(organizationId, userId, "precedents:create");

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
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to create precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
