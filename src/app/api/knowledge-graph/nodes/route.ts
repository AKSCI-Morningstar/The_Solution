import { NextResponse } from "next/server";
import { getGraphStats, getGraphNodes } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 50;
    const [stats, nodes] = await Promise.all([
      getGraphStats(orgId),
      getGraphNodes(orgId, { entityType, search, page, pageSize }),
    ]);
    return NextResponse.json({ ...nodes, stats });
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
