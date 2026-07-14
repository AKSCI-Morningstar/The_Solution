import { NextResponse } from "next/server";
import {
  listContradictions,
  getContradictionSummary,
} from "@/server/contradictions";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());

    if (url.searchParams.get("summary") === "true") {
      const summary = await getContradictionSummary(orgId);
      return NextResponse.json({ data: summary });
    }

    const result = await listContradictions(orgId, filters);
    return NextResponse.json(result);
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
