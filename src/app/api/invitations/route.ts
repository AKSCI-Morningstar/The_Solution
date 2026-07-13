import { NextResponse } from "next/server";
import { listPendingInvitations } from "@/server/organizations";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const invitations = await listPendingInvitations();
    return NextResponse.json({ data: invitations });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
