import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError, ValidationError } from "@/shared/errors";
import type { CreateFragmentInput, FragmentFilterInput } from "./validation";

export async function createFragment(
  organizationId: string,
  userId: string,
  input: CreateFragmentInput,
) {
  const existing = await prisma.ruleFragment.findFirst({
    where: { organizationId, name: { equals: input.name, mode: "insensitive" } },
  });
  if (existing) {
    throw new ValidationError({
      name: [`A fragment named "${input.name}" already exists in this organization`],
    });
  }

  return prisma.ruleFragment.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description,
      condition: input.condition as unknown as Prisma.InputJsonValue,
      createdById: userId,
    },
  });
}

export async function listFragments(organizationId: string, filters: FragmentFilterInput) {
  const { search, page, pageSize } = filters;
  const where: Prisma.RuleFragmentWhereInput = { organizationId };
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [data, total] = await Promise.all([
    prisma.ruleFragment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.ruleFragment.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getFragment(fragmentId: string, organizationId: string) {
  const fragment = await prisma.ruleFragment.findFirst({
    where: { id: fragmentId, organizationId },
  });
  if (!fragment) throw new NotFoundError("RuleFragment", fragmentId);
  return fragment;
}
