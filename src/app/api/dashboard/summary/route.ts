import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { requirePermission } from "@/server/rbac";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    await requirePermission(orgId, user.id, "organization:read");

    const [totalEntities, totalDocuments, totalRelationships, completedJobs] = await Promise.all([
      prisma.engineeringEntity.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      prisma.ingestionDocument.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      prisma.engineeringRelationship.count({
        where: { organizationId: orgId },
      }),
      prisma.ingestionJob.count({
        where: { organizationId: orgId, status: "COMPLETED" },
      }),
    ]);

    return NextResponse.json({
      data: { totalEntities, totalDocuments, totalRelationships, completedJobs },
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
