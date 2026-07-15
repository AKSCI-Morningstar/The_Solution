import { NextResponse } from "next/server";
import { exportFormatSchema, generateExport, getReport } from "@/server/reporting";
import type { ReportPayload } from "@/server/reporting";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { requirePermission } from "@/server/rbac";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    await requirePermission(orgId, user.id, "reporting:execute");

    const { id } = await params;
    const url = new URL(request.url);
    const parsed = exportFormatSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const report = await getReport(id, orgId);
    const result = await generateExport(
      orgId,
      report.id,
      report.title,
      report.data as unknown as ReportPayload,
      parsed.data.format,
    );

    if (!result.implemented) {
      return NextResponse.json({ data: result });
    }

    return new NextResponse(result.content, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
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
