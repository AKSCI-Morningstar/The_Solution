import { NextResponse } from "next/server";
import { syncGraphIndexes } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function POST() {
  try {
    const orgId = await requireActiveOrganization();
    const stats = await syncGraphIndexes(orgId);
    return NextResponse.json({ data: stats });
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
