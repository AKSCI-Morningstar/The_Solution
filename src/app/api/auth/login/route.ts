import { NextResponse } from "next/server";
import { loginUser } from "@/server/auth";
import { UnauthorizedError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Validation failed", details: { email: ["Email and password are required"] } },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;

    const result = await loginUser({
      email: email.toLowerCase().trim(),
      password,
      rememberMe: rememberMe === true,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ data: result.user });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
