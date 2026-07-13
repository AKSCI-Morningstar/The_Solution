import { NextResponse } from "next/server";
import { resetPassword } from "@/server/auth";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Validation failed", details: { token: ["Token is required"] } },
        { status: 400 },
      );
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: { password: ["Password must be at least 8 characters"] },
        },
        { status: 400 },
      );
    }

    await resetPassword(token, password);

    return NextResponse.json({ data: { message: "Password reset successfully" } });
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
