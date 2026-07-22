import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import {
  searchDesignPatterns,
  copyDesignPattern,
} from "@/server/intelligence/design-pattern-service";

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const partType = searchParams.get("partType") || undefined;
    const material = searchParams.get("material") || undefined;

    const patterns = await searchDesignPatterns({ organizationId: orgId, partType, material });
    return NextResponse.json({ data: patterns });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patternId, targetProjectName } = body;

    if (!patternId || !targetProjectName) {
      return NextResponse.json(
        { error: "Missing patternId or targetProjectName" },
        { status: 400 },
      );
    }

    const result = await copyDesignPattern(patternId, targetProjectName);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
