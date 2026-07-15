import { NextResponse } from "next/server";
import {
  getSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierSchema,
} from "@/server/suppliers";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac/authorization-service";
import { AppError } from "@/shared/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:read");

    const { id } = await params;
    const supplier = await getSupplier(id, orgId);
    return NextResponse.json({ data: supplier });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:update");

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const supplier = await updateSupplier(id, orgId, parsed.data, user.id);
    return NextResponse.json({ data: supplier });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:delete");

    const { id } = await params;
    await deleteSupplier(id, orgId, user.id);
    return NextResponse.json({ data: { message: "Supplier deleted" } });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
