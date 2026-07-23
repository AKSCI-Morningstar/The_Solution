import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { dismissAnomaly } from "@/server/anomalies/anomaly-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updated = await dismissAnomaly(id, session.userId);
  return NextResponse.json({ data: updated });
}
