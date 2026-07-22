import { prisma } from "@/server/db";

export async function getCausalTwins(organizationId: string) {
  const existing = await prisma.causalFlightTwin.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
  });

  if (existing.length > 0) return existing;

  // Find an engineering entity
  const entity = await prisma.engineeringEntity.findFirst({
    where: { organizationId, deletedAt: null },
  });

  const componentId = entity ? entity.id : "default-component-id";

  const twins = [
    {
      organizationId,
      componentId,
      flightHours: 1240.5,
      metrologyAnomalyMM: 0.038,
      predictedLifeHrs: 8000.0,
    },
  ];

  const created = [];
  for (const t of twins) {
    const item = await prisma.causalFlightTwin.create({ data: t });
    created.push(item);
  }

  return created;
}

export async function simulateFlightTwinWear(organizationId: string, twinId: string) {
  const twin = await prisma.causalFlightTwin.findFirst({
    where: { id: twinId, organizationId },
  });

  if (!twin) throw new Error("Causal twin not found");

  return prisma.causalFlightTwin.update({
    where: { id: twinId },
    data: {
      flightHours: twin.flightHours + 250.0,
      predictedLifeHrs: Math.max(2000.0, twin.predictedLifeHrs - 400.0),
    },
  });
}
