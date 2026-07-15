import { NextResponse } from "next/server";
import { logoutUser } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ data: { message: "Logged out successfully" } });
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
