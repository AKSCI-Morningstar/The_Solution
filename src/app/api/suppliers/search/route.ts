import { NextResponse } from "next/server";
import { searchSuppliers } from "@/server/suppliers";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac/authorization-service";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:read");

    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
    const results = await searchSuppliers(orgId, query, limit);
    return NextResponse.json({ data: results });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
