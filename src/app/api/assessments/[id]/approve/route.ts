import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { approveAssessment } from "@/server/assessments/assessment-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await approveAssessment(
    id,
    session.userId,
    body.approvalReason || "Approved assessment criteria",
  );
  return NextResponse.json({ data: updated });
}
