import { NextResponse } from "next/server";
import { registerUser } from "@/server/auth";
import { ValidationError, AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Validation failed", details: { email: ["Email is required"] } },
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

    const result = await registerUser({ email: email.toLowerCase().trim(), password, name });

    return NextResponse.json({ data: result.user }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
