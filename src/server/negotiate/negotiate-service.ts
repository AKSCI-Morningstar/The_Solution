import { prisma } from "@/server/db";

export async function getNegotiationSessions(organizationId: string) {
  const existing = await prisma.negotiationSession.findMany({
    where: { organizationId },
    orderBy: { settledAt: "desc" },
  });

  if (existing.length > 0) return existing;

  const sessions = [
    {
      organizationId,
      componentId: "propulsion-manifold-v2",
      oemTargetCost: 2500.0,
      supplierPrice: 3200.0,
      negotiatedCost: 0.0,
      status: "PENDING",
    },
  ];

  const created = [];
  for (const s of sessions) {
    const item = await prisma.negotiationSession.create({ data: s });
    created.push(item);
  }

  return created;
}

export async function runNegotiation(organizationId: string, sessionId: string) {
  const session = await prisma.negotiationSession.findFirst({
    where: { id: sessionId, organizationId },
  });

  if (!session) throw new Error("Negotiation session not found");

  const negotiatedCost = 2800.0;

  return prisma.negotiationSession.update({
    where: { id: sessionId },
    data: {
      status: "SETTLED",
      negotiatedCost,
      settledAt: new Date(),
    },
  });
}
