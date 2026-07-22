import { prisma } from "@/server/db";

export async function getTribalLogs(organizationId: string) {
  const existing = await prisma.tribalKnowledgeLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (existing.length > 0) return existing;

  const logs = [
    {
      organizationId,
      operatorName: "Marcus Vance (Senior CNC Specialist)",
      transcription:
        "When milling titanium grade 5 brackets under high moisture, I had to decrease target spindle speed to 10500 RPM to mitigate thermal ripple stress on the bolt holes.",
      associatedCert: "AS9100-Milling-1042",
      gcodeOffset: "G01 X15.4 Y20.8 F3500 -> G01 F3000",
    },
  ];

  const created = [];
  for (const l of logs) {
    const item = await prisma.tribalKnowledgeLog.create({ data: l });
    created.push(item);
  }

  return created;
}

export async function captureOperatorOverride(
  organizationId: string,
  operatorName: string,
  transcription: string,
  associatedCert?: string,
  gcodeOffset?: string,
) {
  return prisma.tribalKnowledgeLog.create({
    data: {
      organizationId,
      operatorName,
      transcription,
      associatedCert: associatedCert || null,
      gcodeOffset: gcodeOffset || "AUTO_GCODE_OFFSET_APPLIED",
    },
  });
}
