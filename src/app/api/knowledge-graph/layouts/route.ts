import { NextResponse } from "next/server";
import { saveLayout, listLayouts } from "@/server/knowledge-graph";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const orgId = await requireActiveOrganization();
    const layouts = await listLayouts(orgId);
    return NextResponse.json({ data: layouts });
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

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const body = await request.json();
    if (!body.name || !body.nodePositions) {
      return NextResponse.json({ error: "name and nodePositions are required" }, { status: 400 });
    }
    const layout = await saveLayout(orgId, body.name, body.nodePositions);
    return NextResponse.json({ data: layout }, { status: 201 });
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
