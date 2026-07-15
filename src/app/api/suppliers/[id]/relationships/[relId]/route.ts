import { NextResponse } from "next/server";
import { deleteRelationship } from "@/server/suppliers";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac/authorization-service";
import { AppError } from "@/shared/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; relId: string }> },
) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:update");
    const { relId } = await params;
    await deleteRelationship(relId, orgId);
    return NextResponse.json({ data: { message: "Relationship deleted" } });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
