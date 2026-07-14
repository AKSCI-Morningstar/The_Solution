import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logger } from "@/shared/logging";

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? "0.1.0";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", timestamp, version, database: "connected" });
  } catch (error) {
    logger.error("Health check: database unreachable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { status: "unhealthy", timestamp, version, database: "unreachable" },
      { status: 503 },
    );
  }
}
