import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { validateSession } from "@/server/auth/session-service";
import { ENTITY_TYPE_LABELS } from "@/server/engineering/constants";
import { AppError } from "@/shared/errors";

interface SearchResult {
  id: string;
  type: "entity" | "document" | "organization" | "user";
  label: string;
  subtitle: string;
  href: string;
  icon: "Tags" | "FileText" | "Building2" | "Hash";
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const session = await validateSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(
      Math.max(1, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT)),
      MAX_LIMIT,
    );

    if (q.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ data: [] });
    }

    const perType = Math.ceil(limit / 4);
    const results: SearchResult[] = [];

    const [entities, documents, organizations, users] = await Promise.all([
      prisma.engineeringEntity.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { identifier: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: perType,
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, identifier: true, entityType: true },
      }),
      prisma.ingestionDocument.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          fileName: { contains: q, mode: "insensitive" },
        },
        take: perType,
        orderBy: { updatedAt: "desc" },
        select: { id: true, fileName: true, fileExtension: true },
      }),
      prisma.organization.findMany({
        where: {
          members: { some: { userId: session.userId, status: "active" } },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
        take: perType,
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.user.findMany({
        where: {
          memberships: { some: { organizationId: orgId, status: "active" } },
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: perType,
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
    ]);

    for (const entity of entities) {
      results.push({
        id: entity.id,
        type: "entity",
        label: entity.name,
        subtitle: ENTITY_TYPE_LABELS[entity.entityType] ?? entity.entityType,
        href: `/entities/${entity.id}`,
        icon: "Tags",
      });
    }

    for (const doc of documents) {
      results.push({
        id: doc.id,
        type: "document",
        label: doc.fileName,
        subtitle: doc.fileExtension.toUpperCase(),
        href: `/ingestion/documents/${doc.id}`,
        icon: "FileText",
      });
    }

    for (const org of organizations) {
      results.push({
        id: org.id,
        type: "organization",
        label: org.name,
        subtitle: org.slug,
        href: `/organizations/${org.id}/settings`,
        icon: "Building2",
      });
    }

    for (const user of users) {
      results.push({
        id: user.id,
        type: "user",
        label: user.name ?? user.email,
        subtitle: user.email,
        href: `/organizations/${orgId}/settings`,
        icon: "Hash",
      });
    }

    return NextResponse.json({ data: results.slice(0, limit) });
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
