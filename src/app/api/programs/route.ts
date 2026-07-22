import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import { getPrograms, createProgram } from "@/server/programs/program-service";

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const programs = await getPrograms(orgId);
    return NextResponse.json({ data: programs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const body = await request.json();
    const { name, aircraft, budgetTarget, scheduleTarget, qualityTarget, targetCompletionDate } =
      body;

    if (!name || !aircraft) {
      return NextResponse.json({ error: "Missing required program fields" }, { status: 400 });
    }

    const program = await createProgram({
      organizationId: orgId,
      name,
      aircraft,
      budgetTarget: budgetTarget || 500000000,
      scheduleTarget: scheduleTarget || 540,
      qualityTarget: qualityTarget || 3.0,
      targetCompletionDate: targetCompletionDate
        ? new Date(targetCompletionDate)
        : new Date(Date.now() + 540 * 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({ data: program }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
