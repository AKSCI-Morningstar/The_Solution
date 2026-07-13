import { NextResponse } from "next/server";
import { getSubgraph } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType") ?? undefined;
    const limit = Number(url.searchParams.get("limit")) || 100;
    const result = await getSubgraph(orgId, { entityType, limit });
    return NextResponse.json({ data: result });
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

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const body = await request.json();
    const { nodeIds, depth = 1 } = body;
    if (!nodeIds || !Array.isArray(nodeIds)) {
      return NextResponse.json({ error: "nodeIds array is required" }, { status: 400 });
    }
    const { expandSubgraph } = await import("@/server/knowledge-graph");
    const result = await expandSubgraph(nodeIds, orgId, depth);
    return NextResponse.json({ data: result });
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
