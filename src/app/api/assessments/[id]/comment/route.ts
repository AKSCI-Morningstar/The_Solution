import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { addComment } from "@/server/assessments/assessment-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const comment = await addComment(id, session.userId, body.text);
  return NextResponse.json({ data: comment }, { status: 201 });
}
