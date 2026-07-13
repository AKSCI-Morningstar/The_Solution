import { NextResponse } from "next/server";
import { deleteRelationship } from "@/server/engineering";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const { id } = await params;
    await deleteRelationship(id, orgId, "");
    return NextResponse.json({ data: { message: "Relationship deleted" } });
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
