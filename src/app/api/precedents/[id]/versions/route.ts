import { NextRequest, NextResponse } from "next/server";
import { getPrecedentVersions } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireActiveOrganization();
    const { id } = await params;
    const versions = await getPrecedentVersions(id);
    return NextResponse.json({ data: versions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch versions";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
