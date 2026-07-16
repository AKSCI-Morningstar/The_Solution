import { NextRequest, NextResponse } from "next/server";
import { listPrecedents, createPrecedent } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { PrecedentCreateInput } from "@/features/precedents/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = await requireActiveOrganization();

    const filter = {
      organizationId,
      search: searchParams.get("search") || undefined,
      supplier: searchParams.get("supplier") || undefined,
      requirement: searchParams.get("requirement") || undefined,
      component: searchParams.get("component") || undefined,
      project: searchParams.get("project") || undefined,
      certification: searchParams.get("certification") || undefined,
      standard: searchParams.get("standard") || undefined,
      decisionOwner: searchParams.get("decisionOwner") || undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean),
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      confidenceMin: searchParams.get("confidenceMin") ? parseFloat(searchParams.get("confidenceMin")!) : undefined,
      confidenceMax: searchParams.get("confidenceMax") ? parseFloat(searchParams.get("confidenceMax")!) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await listPrecedents(filter);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch precedents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = await requireActiveOrganization();
    const user = await getCurrentUser();
    const body = (await req.json()) as PrecedentCreateInput;

    body.organizationId = organizationId;

    const precedent = await createPrecedent(body, user?.id);
    return NextResponse.json({ data: precedent }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
