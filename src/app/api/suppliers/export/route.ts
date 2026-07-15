import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac/authorization-service";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    await requirePermission(orgId, user.id, "suppliers:read");

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        certifications: {
          where: { status: "ACTIVE" },
          select: { certificationType: true, certificationName: true, expiryDate: true },
        },
        capabilities: {
          where: { status: "ACTIVE" },
          select: { capabilityType: true, capabilityName: true },
        },
        facilities: { select: { name: true, type: true, city: true, country: true } },
        _count: { select: { contacts: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: suppliers });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
