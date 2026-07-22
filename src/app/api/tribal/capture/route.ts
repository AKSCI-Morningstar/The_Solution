import { NextResponse } from "next/server";
import { getTribalLogs, captureOperatorOverride } from "@/server/tribal/tribal-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const logs = await getTribalLogs(orgId);
    return NextResponse.json({ data: logs });
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
    const { operatorName, transcription, associatedCert, gcodeOffset } = body;
    if (!operatorName || !transcription) {
      return NextResponse.json(
        { error: "operatorName and transcription are required" },
        { status: 400 },
      );
    }

    const log = await captureOperatorOverride(
      orgId,
      operatorName,
      transcription,
      associatedCert,
      gcodeOffset,
    );
    return NextResponse.json({ data: log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
