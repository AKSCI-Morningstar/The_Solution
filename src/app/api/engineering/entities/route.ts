import { NextResponse } from "next/server";
import { listEntities, createEntity, createEntitySchema } from "@/server/engineering";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { requirePermission } from "@/server/rbac";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    await requirePermission(orgId, user.id, "engineering:read");

    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const result = await listEntities(orgId, filters);
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
    await requirePermission(orgId, user.id, "engineering:create");

    const body = await request.json();
    const parsed = createEntitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const entity = await createEntity(orgId, parsed.data, user.id);
    return NextResponse.json({ data: entity }, { status: 201 });
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
