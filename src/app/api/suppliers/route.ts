import { NextResponse } from "next/server";
import {
  listSuppliers,
  createSupplier,
  supplierFilterSchema,
  createSupplierSchema,
} from "@/server/suppliers";
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
    const parsed = supplierFilterSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const result = await listSuppliers(orgId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:create");

    const body = await request.json();
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const supplier = await createSupplier(orgId, parsed.data, user.id);
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
