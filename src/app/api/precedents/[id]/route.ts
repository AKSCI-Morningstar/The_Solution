import { NextRequest, NextResponse } from "next/server";
import {
  getPrecedentById,
  updatePrecedent,
  deletePrecedent,
} from "@/server/precedents/precedent-service";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { getCurrentUser } from "@/server/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let organizationId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization required" },
        { status: 401 },
      );
    }

    const precedent = await getPrecedentById(id, organizationId);
    if (!precedent) {
      return NextResponse.json({ error: "Precedent not found" }, { status: 404 });
    }

    return NextResponse.json({ data: precedent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    let organizationId: string | undefined;
    let userId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization required" },
        { status: 401 },
      );
    }

    const updated = await updatePrecedent(id, organizationId, {
      title: body.title,
      summary: body.summary,
      engineeringQuestion: body.engineeringQuestion,
      decisionMade: body.decisionMade,
      supportingEvidence: body.supportingEvidence,
      contradictions: body.contradictions,
      missingEvidence: body.missingEvidence,
      outcome: body.outcome,
      lessonsLearned: body.lessonsLearned,
      relatedProjects: body.relatedProjects,
      relatedSuppliers: body.relatedSuppliers,
      relatedRequirements: body.relatedRequirements,
      relatedDocuments: body.relatedDocuments,
      relatedComponents: body.relatedComponents,
      relatedStandards: body.relatedStandards,
      relatedCertifications: body.relatedCertifications,
      confidence: body.confidence,
      tags: body.tags,
      changeDescription: body.changeDescription || "Updated precedent fields",
      userId,
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let organizationId: string | undefined;
    let userId: string | undefined;
    try {
      organizationId = await requireActiveOrganization();
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // Fallback
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Unauthorized: Active organization required" },
        { status: 401 },
      );
    }

    await deletePrecedent(id, organizationId, userId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete precedent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
