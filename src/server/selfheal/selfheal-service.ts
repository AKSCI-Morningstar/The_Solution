import { prisma } from "@/server/db";

export async function getSupplyChainReroutes(organizationId: string) {
  const existing = await prisma.supplyChainReroute.findMany({
    where: { organizationId },
    orderBy: { reroutedAt: "desc" },
  });

  if (existing.length > 0) return existing;

  const reroutes = [
    {
      organizationId,
      programName: "Starliner Propulsion Manifold Assembly",
      disruptedNode: "Titanium Forge (Region: Eastern Europe)",
      alternateNode: "Apex Additive Aerospace (US-West)",
      gcodeRewritten: false,
    },
  ];

  const created = [];
  for (const r of reroutes) {
    const item = await prisma.supplyChainReroute.create({ data: r });
    created.push(item);
  }

  return created;
}

export async function executeAutonomousRecovery(organizationId: string, rerouteId: string) {
  const reroute = await prisma.supplyChainReroute.findFirst({
    where: { id: rerouteId, organizationId },
  });

  if (!reroute) throw new Error("Reroute log not found");

  return prisma.supplyChainReroute.update({
    where: { id: rerouteId },
    data: {
      gcodeRewritten: true,
      alternateNode: "Apex Additive Aerospace (US-West) - G-Code Re-compiled for EOS M400 printer",
    },
  });
}
