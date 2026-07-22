import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getProgramHealthDetails } from "@/server/programs/program-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const details = await getProgramHealthDetails(id);

    return NextResponse.json({ data: details });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
