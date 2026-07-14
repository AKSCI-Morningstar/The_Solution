import { NextResponse } from "next/server";
import { getParserHealth } from "@/server/ingestion";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    await requireActiveOrganization();
    const parsers = getParserHealth();
    return NextResponse.json({ data: parsers });
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
