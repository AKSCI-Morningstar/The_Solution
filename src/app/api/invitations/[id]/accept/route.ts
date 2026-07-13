import { NextResponse } from "next/server";
import { acceptInvitation } from "@/server/organizations";
import { AppError } from "@/shared/errors";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await acceptInvitation(id);
    return NextResponse.json({ data: { message: "Invitation accepted" } });
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
