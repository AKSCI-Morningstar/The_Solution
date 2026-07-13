import { prisma } from "@/server/db";
import { validateSession } from "@/server/auth/session-service";
import { generateUniqueSlug } from "./slug";
import { setActiveOrganizationId } from "./organization-context";
import { NotFoundError, ValidationError, ForbiddenError } from "@/shared/errors";

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export interface OrganizationResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  memberCount: number;
  role: string;
  createdAt: Date;
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<OrganizationResult> {
  const session = await validateSession();
  if (!session) throw new ForbiddenError("Not authenticated");

  const { name, description } = input;

  if (!name || name.trim().length === 0) {
    throw new ValidationError({ name: ["Organization name is required"] });
  }
  if (name.length > 100) {
    throw new ValidationError({ name: ["Organization name must be 100 characters or less"] });
  }

  const slug = await generateUniqueSlug(prisma, name);

  const org = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: name.trim(), slug, description, ownerId: session.userId },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      },
    });

    await tx.authEvent.create({
      data: {
        userId: session.userId,
        action: "organization.created",
        metadata: { organizationId: org.id, name },
      },
    });

    return org;
  });

  await setActiveOrganizationId(org.id);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    status: org.status,
    memberCount: 1,
    role: "owner",
    createdAt: org.createdAt,
  };
}

export async function listUserOrganizations(): Promise<OrganizationResult[]> {
  const session = await validateSession();
  if (!session) return [];

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.userId, status: "active" },
    include: {
      organization: {
        include: {
          _count: { select: { members: { where: { status: "active" } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    description: m.organization.description,
    status: m.organization.status,
    memberCount: m.organization._count.members,
    role: m.role,
    createdAt: m.organization.createdAt,
  }));
}

export async function getOrganization(organizationId: string): Promise<OrganizationResult | null> {
  const session = await validateSession();
  if (!session) return null;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.userId,
      },
    },
    include: {
      organization: {
        include: {
          _count: { select: { members: { where: { status: "active" } } } },
        },
      },
    },
  });

  if (!membership || membership.status !== "active") return null;

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    description: membership.organization.description,
    status: membership.organization.status,
    memberCount: membership.organization._count.members,
    role: membership.role,
    createdAt: membership.organization.createdAt,
  };
}

export async function updateOrganization(
  organizationId: string,
  input: { name?: string; description?: string },
): Promise<OrganizationResult> {
  const session = await validateSession();
  if (!session) throw new ForbiddenError("Not authenticated");

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.userId,
      },
    },
  });

  if (!membership || membership.role !== "owner") {
    throw new ForbiddenError("Only organization owners can update settings");
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new ValidationError({ name: ["Organization name is required"] });
    }
    data.name = input.name.trim();
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data,
  });

  await prisma.authEvent.create({
    data: { userId: session.userId, action: "organization.updated", metadata: { organizationId } },
  });

  const count = await prisma.organizationMember.count({
    where: { organizationId, status: "active" },
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    status: org.status,
    memberCount: count,
    role: "owner",
    createdAt: org.createdAt,
  };
}

export async function switchOrganization(organizationId: string): Promise<void> {
  const session = await validateSession();
  if (!session) throw new ForbiddenError("Not authenticated");

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.userId,
      },
    },
  });

  if (!membership || membership.status !== "active") {
    throw new NotFoundError("Organization", organizationId);
  }

  await setActiveOrganizationId(organizationId);
}
