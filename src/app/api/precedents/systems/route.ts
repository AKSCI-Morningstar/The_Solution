import { NextResponse } from "next/server";
import { getUniqueSystems } from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";

export async function GET() {
  try {
    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Graceful fallback
    }

    const systems = await getUniqueSystems(organizationId);
    return NextResponse.json({ data: systems });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch unique systems";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

