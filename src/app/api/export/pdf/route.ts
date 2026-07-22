import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    // Return structured print payload ready for client window printing / PDF saving
    return NextResponse.json({
      success: true,
      title: title || "AKSCI Engineering Intelligence Report",
      generatedAt: new Date().toISOString(),
      content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
