import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { validateSession } from "@/server/auth/session-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.drawingComparisonJob.findUnique({
      where: { id },
      include: {
        revA: true,
        revB: true,
        changes: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Comparison job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: job });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
