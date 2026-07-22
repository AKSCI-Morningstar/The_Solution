import { prisma } from "@/server/db";

export async function getSpindleTelemetry(organizationId: string) {
  const existing = await prisma.spindleTelemetry.findMany({
    where: { organizationId },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  if (existing.length > 0) return existing;

  return simulateSpindleTelemetries(organizationId);
}

export async function simulateSpindleTelemetries(organizationId: string) {
  // Find a supplier in the organization to link to
  const supplier = await prisma.supplier.findFirst({
    where: { organizationId, status: "ACTIVE" },
  });

  const supplierId = supplier ? supplier.id : "default-supplier-id";

  const telemetries = [
    {
      organizationId,
      supplierId,
      machineId: "5-Axis CNC Mill DMG MORI DMU 50",
      spindleSpeedRPM: 12000.0,
      feedRateMMPM: 3500.0,
      vibrationG: 0.12,
      deviationMM: 0.015,
      isAdjusted: false,
    },
    {
      organizationId,
      supplierId,
      machineId: "5-Axis CNC Mill DMG MORI DMU 50",
      spindleSpeedRPM: 11800.0,
      feedRateMMPM: 3450.0,
      vibrationG: 0.45,
      deviationMM: 0.052,
      isAdjusted: false,
    },
    {
      organizationId,
      supplierId,
      machineId: "EOS M400 Laser Powder Bed Fusion",
      spindleSpeedRPM: 0.0,
      feedRateMMPM: 1200.0,
      vibrationG: 0.02,
      deviationMM: 0.008,
      isAdjusted: false,
    },
  ];

  await prisma.spindleTelemetry.deleteMany({
    where: { organizationId },
  });

  const created = [];
  for (const t of telemetries) {
    const item = await prisma.spindleTelemetry.create({
      data: t,
    });
    created.push(item);
  }

  return created;
}

export async function adjustTolerance(organizationId: string, telemetryId: string) {
  const telemetry = await prisma.spindleTelemetry.findFirst({
    where: { id: telemetryId, organizationId },
  });

  if (!telemetry) {
    throw new Error("Telemetry record not found");
  }

  return prisma.spindleTelemetry.update({
    where: { id: telemetryId },
    data: {
      isAdjusted: true,
      deviationMM: 0.012,
    },
  });
}
