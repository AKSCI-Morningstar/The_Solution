import { NextResponse } from "next/server";
import { getLayout, deleteLayout } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const { id } = await params;
    const layout = await getLayout(id, orgId);
    return NextResponse.json({ data: layout });
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const { id } = await params;
    await deleteLayout(id, orgId);
    return NextResponse.json({ data: { message: "Layout deleted" } });
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
