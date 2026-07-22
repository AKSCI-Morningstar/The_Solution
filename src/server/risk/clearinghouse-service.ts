import { prisma } from "@/server/db";

export async function getSupplyChainRisks(organizationId: string) {
  const existing = await prisma.supplyChainRisk.findMany({
    where: { organizationId },
    orderBy: { simulatedAt: "desc" },
    take: 5,
  });

  if (existing.length > 0) return existing;

  return simulateSupplyChainRisks(organizationId);
}

export async function simulateSupplyChainRisks(organizationId: string) {
  const risks = [
    {
      organizationId,
      programName: "Artemis III Nozzle Ring Assembly",
      criticalPathRisk: 78.4,
      bottlenecks: {
        supplierName: "Apex Additive Aerospace",
        cause: "LPBF spindle-hour congestion",
        leadTimeDelayDays: 22,
      },
      delayProbability: 0.85,
    },
    {
      organizationId,
      programName: "eVTOL Carbon Wing Spar",
      criticalPathRisk: 24.5,
      bottlenecks: {
        supplierName: "Composite Structural Systems",
        cause: "Resin material certification delay",
        leadTimeDelayDays: 5,
      },
      delayProbability: 0.3,
    },
  ];

  await prisma.supplyChainRisk.deleteMany({
    where: { organizationId },
  });

  const created = [];
  for (const r of risks) {
    const item = await prisma.supplyChainRisk.create({
      data: r,
    });
    created.push(item);
  }

  return created;
}

export async function triggerMitigation(organizationId: string, riskId: string) {
  const risk = await prisma.supplyChainRisk.findFirst({
    where: { id: riskId, organizationId },
  });

  if (!risk) {
    throw new Error("Risk record not found");
  }

  // Update showing mitigation applied: re-routing drops risk parameters
  return prisma.supplyChainRisk.update({
    where: { id: riskId },
    data: {
      criticalPathRisk: 12.0,
      delayProbability: 0.15,
      bottlenecks: {
        supplierName: "Helix Machining Solutions (Alternate)",
        cause: "Mitigated via automated capacity re-routing",
        leadTimeDelayDays: 0,
      },
    },
  });
}
