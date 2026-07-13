import { NextResponse } from "next/server";
import { getGraphEdges } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const relationshipType = url.searchParams.get("relationshipType") ?? undefined;
    const sourceNodeId = url.searchParams.get("sourceNodeId") ?? undefined;
    const targetNodeId = url.searchParams.get("targetNodeId") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 50;
    const edges = await getGraphEdges(orgId, {
      relationshipType,
      sourceNodeId,
      targetNodeId,
      page,
      pageSize,
    });
    return NextResponse.json(edges);
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
