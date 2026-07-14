import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Validation failed", details: { email: ["Email is required"] } },
        { status: 400 },
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;

    await requestPasswordReset(email.toLowerCase().trim(), ipAddress);

    return NextResponse.json({
      data: { message: "If the email exists, a reset link has been sent" },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
