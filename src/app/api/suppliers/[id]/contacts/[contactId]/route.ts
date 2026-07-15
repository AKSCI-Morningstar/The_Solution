import { NextResponse } from "next/server";
import { updateContact, deleteContact, createContactSchema } from "@/server/suppliers";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac/authorization-service";
import { AppError } from "@/shared/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
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
    const { id, contactId } = await params;
    const body = await request.json();
    const parsed = createContactSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const contact = await updateContact(contactId, id, orgId, parsed.data);
    return NextResponse.json({ data: contact });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
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
    const { id, contactId } = await params;
    await deleteContact(contactId, id, orgId);
    return NextResponse.json({ data: { message: "Contact deleted" } });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
