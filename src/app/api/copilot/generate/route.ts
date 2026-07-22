import { NextResponse } from "next/server";
import { synthesizeDesignVariants } from "@/server/copilot/generative-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { intent } = body;
    if (!intent || !intent.trim()) {
      return NextResponse.json({ error: "Intent is required" }, { status: 400 });
    }

    const variants = await synthesizeDesignVariants(orgId, intent.trim());
    return NextResponse.json({ data: variants });
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
