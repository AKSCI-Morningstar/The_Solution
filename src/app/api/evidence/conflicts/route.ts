import { NextResponse } from "next/server";
import {
  buildEvidenceGraph,
  detectConflicts,
  conflictFilterSchema,
} from "@/server/evidence";
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
    let conflicts = detectConflicts(graph);

    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = conflictFilterSchema.safeParse(params);
    if (parsed.success) {
      if (parsed.data.type) {
        conflicts = conflicts.filter((c) => c.type === parsed.data.type);
      }
      if (parsed.data.severity) {
        conflicts = conflicts.filter((c) => c.severity === parsed.data.severity);
      }
    }

    return NextResponse.json({ data: conflicts });
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
