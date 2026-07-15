import { NextResponse } from "next/server";
import { listAuditEventsForExport, auditFilterSchema } from "@/server/audit";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { requirePermission } from "@/server/rbac";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
    await requirePermission(orgId, user.id, "settings:read");

    const url = new URL(request.url);
    const parsed = auditFilterSchema
      .omit({ page: true, pageSize: true })
      .safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const rows = await listAuditEventsForExport(orgId, parsed.data);
    const header = ["id", "action", "entity", "entityId", "createdAt", "metadata"];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.action,
          row.entity,
          row.entityId,
          row.createdAt.toISOString(),
          JSON.stringify(row.metadata ?? {}),
        ]
          .map((cell) => escapeCsv(String(cell)))
          .join(","),
      ),
    ];

    const csv = lines.join("\n");
    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
