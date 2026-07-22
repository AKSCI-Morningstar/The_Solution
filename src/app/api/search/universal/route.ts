import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import { prisma } from "@/server/db";

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json({ data: [] });
    }

    const [drawings, decisions, suppliers, programs] = await Promise.all([
      prisma.drawingProject.findMany({
        where: { ownerId: session.userId, name: { contains: query, mode: "insensitive" } },
        take: 4,
      }),
      prisma.engineeringDecision.findMany({
        where: { organizationId: orgId, description: { contains: query, mode: "insensitive" } },
        take: 4,
      }),
      prisma.supplier.findMany({
        where: { organizationId: orgId, name: { contains: query, mode: "insensitive" } },
        take: 4,
      }),
      prisma.program.findMany({
        where: { organizationId: orgId, name: { contains: query, mode: "insensitive" } },
        take: 4,
      }),
    ]);

    const results = [
      ...drawings.map((d) => ({ id: d.id, title: d.name, type: "Drawing", href: `/drawings` })),
      ...decisions.map((d) => ({
        id: d.id,
        title: d.description,
        type: "Decision",
        href: `/decisions`,
      })),
      ...suppliers.map((s) => ({ id: s.id, title: s.name, type: "Supplier", href: `/suppliers` })),
      ...programs.map((p) => ({ id: p.id, title: p.name, type: "Program", href: `/programs` })),
    ];

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
