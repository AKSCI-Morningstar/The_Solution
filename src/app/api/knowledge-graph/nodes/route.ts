import { NextResponse } from "next/server";
import { getGraphStats, getGraphNodes } from "@/server/knowledge-graph";
import { nodesQuerySchema } from "@/server/knowledge-graph/validation";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const parsed = nodesQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const [stats, nodes] = await Promise.all([
      getGraphStats(orgId),
      getGraphNodes(orgId, parsed.data),
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
