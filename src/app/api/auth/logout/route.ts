import { NextResponse } from "next/server";
import { logoutUser } from "@/server/auth";

export async function POST() {
  await logoutUser();
  return NextResponse.json({ data: { message: "Logged out successfully" } });
}
