import { NextResponse } from "next/server";
import { getOrganizationRoles } from "@/server/rbac";
import { validateSession } from "@/server/auth/session-service";
import { AppError } from "@/shared/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await validateSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const roles = await getOrganizationRoles(id);
    return NextResponse.json({ data: roles });
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
