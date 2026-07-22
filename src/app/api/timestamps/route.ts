import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { requirePermission } from "@/server/rbac";
import { AppError } from "@/shared/errors";
import { z } from "zod";

const timestampSchema = z.object({
  label: z.string().min(1).max(255),
  value: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

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
    await requirePermission(orgId, user.id, "settings:read");

    const timestamps = await prisma.timestamp.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: timestamps });
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
    await requirePermission(orgId, user.id, "settings:update");

    const body = await request.json();
    const parsed = timestampSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const record = await prisma.timestamp.create({
      data: {
        organizationId: orgId,
        label: parsed.data.label,
        value: parsed.data.value,
        metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return NextResponse.json({ data: record }, { status: 201 });
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
