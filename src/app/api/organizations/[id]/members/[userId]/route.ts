import { NextResponse } from "next/server";
import { removeMember } from "@/server/organizations";
import { AppError } from "@/shared/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id, userId } = await params;
    await removeMember(id, userId);
    return NextResponse.json({ data: { message: "Member removed" } });
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
