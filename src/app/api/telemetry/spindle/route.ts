import { NextResponse } from "next/server";
import {
  getSpindleTelemetry,
  simulateSpindleTelemetries,
  adjustTolerance,
} from "@/server/telemetry/spindle-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const telemetry = await getSpindleTelemetry(orgId);
    return NextResponse.json({ data: telemetry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { action, telemetryId } = body;

    if (action === "simulate") {
      const data = await simulateSpindleTelemetries(orgId);
      return NextResponse.json({ data });
    }

    if (action === "adjust" && telemetryId) {
      const updated = await adjustTolerance(orgId, telemetryId);
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
