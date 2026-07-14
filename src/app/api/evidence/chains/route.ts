import { NextResponse } from "next/server";
import { buildEvidenceGraph, buildEvidenceChains } from "@/server/evidence";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const entityId = url.searchParams.get("entityId");
    const maxDepth = Number(url.searchParams.get("maxDepth") ?? 5);

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId is required" },
        { status: 400 },
      );
    }

    const graph = await buildEvidenceGraph(orgId, entityId, maxDepth);
    const chains = buildEvidenceChains(graph, graph.rootId, maxDepth);
    return NextResponse.json({ data: chains });
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
