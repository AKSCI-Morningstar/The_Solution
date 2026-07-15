import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit";
import { REPORT_TYPE_LABELS } from "./constants";
import { generateReportData } from "./generators";
import type { GenerateReportInput, ReportListFilterInput } from "./validation";

/** Generates a report synchronously (every generator is a bounded, deterministic aggregation - no long-running pipeline is needed) and persists it immutably. */
export async function generateReport(
  organizationId: string,
  generatedById: string,
  input: GenerateReportInput,
) {
  const data = await generateReportData(input.type, organizationId, input.filters);

  const report = await prisma.report.create({
    data: {
      organizationId,
      type: input.type,
      title: input.title ?? REPORT_TYPE_LABELS[input.type],
      filters: input.filters as Prisma.InputJsonValue,
      data: data as unknown as Prisma.InputJsonValue,
      generatedById,
    },
  });

  await recordAuditEvent(organizationId, "REPORT_GENERATED", "Report", report.id, {
    type: input.type,
    rowCount: data.rows.length,
  });

  return report;
}

export async function listReports(organizationId: string, filters: ReportListFilterInput) {
  const { type, isFavorite, search, from, to, sortBy, sortOrder, page, pageSize } = filters;
  const where: Prisma.ReportWhereInput = { organizationId };
  if (type) where.type = type;
  if (isFavorite !== undefined) where.isFavorite = isFavorite;
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        isFavorite: true,
        generatedById: true,
        createdAt: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.report.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getReport(id: string, organizationId: string) {
  const report = await prisma.report.findFirst({ where: { id, organizationId } });
  if (!report) throw new NotFoundError("Report", id);
  return report;
}

export async function deleteReport(id: string, organizationId: string) {
  const report = await getReport(id, organizationId);
  await prisma.report.delete({ where: { id: report.id } });
  await recordAuditEvent(organizationId, "REPORT_DELETED", "Report", id, { type: report.type });
}

export async function toggleFavorite(id: string, organizationId: string) {
  const report = await getReport(id, organizationId);
  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { isFavorite: !report.isFavorite },
  });
  await recordAuditEvent(
    organizationId,
    updated.isFavorite ? "REPORT_FAVORITED" : "REPORT_UNFAVORITED",
    "Report",
    id,
    {},
  );
  return updated;
}
