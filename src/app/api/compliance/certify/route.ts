import { NextResponse } from "next/server";
import {
  checkComponentCompliance,
  generateCertificationProof,
  getComplianceProofs,
} from "@/server/compliance/certification-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get("componentId");

    if (componentId) {
      const check = await checkComponentCompliance(orgId, componentId);
      return NextResponse.json({ data: check });
    }

    const proofs = await getComplianceProofs(orgId);
    return NextResponse.json({ data: proofs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { componentId, requirementId } = body;
    if (!componentId) {
      return NextResponse.json({ error: "componentId is required" }, { status: 400 });
    }

    const proof = await generateCertificationProof(orgId, componentId, requirementId);
    return NextResponse.json({ data: proof });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
