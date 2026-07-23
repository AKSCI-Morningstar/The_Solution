import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { requestChanges } from "@/server/assessments/assessment-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await requestChanges(
    id,
    session.userId,
    body.feedback || "Requested changes for assessment",
  );
  return NextResponse.json({ data: updated });
}
