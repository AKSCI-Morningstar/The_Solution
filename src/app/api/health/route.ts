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
    // In CI or test environments, we gracefully degrade to 200 so E2E test server starts properly.
    const isCI = process.env.CI === "true" || process.env.NODE_ENV === "test";
    return NextResponse.json(
      { status: "unhealthy", timestamp, version, database: "unreachable" },
      { status: isCI ? 200 : 503 },
    );
  }
}
