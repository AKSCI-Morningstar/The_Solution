import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ data: user });
}
