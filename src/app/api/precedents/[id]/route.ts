import { NextRequest, NextResponse } from "next/server";
import {
  getPrecedent,
  getPrecedentWithVersions,
  updatePrecedent,
  deletePrecedent,
} from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";
import { PrecedentUpdateInput } from "@/features/precedents/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireActiveOrganization();
    const { id } = await params;
    const result = await getPrecedentWithVersions(id);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch precedent";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireActiveOrganization();
    const user = await getCurrentUser();
    const { id } = await params;
    const body = (await req.json()) as PrecedentUpdateInput;
    body.id = id;

    const precedent = await updatePrecedent(body, user?.id);
    return NextResponse.json({ data: precedent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update precedent";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireActiveOrganization();
    const { id } = await params;
    await deletePrecedent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete precedent";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
