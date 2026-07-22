/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db";

export async function getKnowledgeAxioms(organizationId: string) {
  const existing = await prisma.knowledgeAxiom.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (existing.length > 0) return existing;

  // Seed default marketplace axioms
  const axioms = [
    {
      organizationId,
      title: "Inconel Thin-Wall Laser Sintering Speed/Power Ratio",
      description:
        "Optimized laser energy density bounds preventing micro-cracking in thin walls (<1.0mm) during LPBF printing.",
      axiomType: "LPBF_PARAMETER",
      rulesApplied: { laserPowerWatts: 380, scanSpeedMMPS: 1100, hatchSpacingMM: 0.12 },
      royaltiesEarned: 1240.5,
    },
    {
      organizationId,
      title: "5-Axis CNC Titanium Rib Chatter Prevention Milling Pass",
      description:
        "Milling spindle frequency guidelines matching mechanical resonance properties of aerospace structural ribs to eliminate surface ripples.",
      axiomType: "CNC_PARAMETER",
      rulesApplied: { spindleSpeedRPM: 11200, radialDepthOfCutMM: 0.25, axialDepthOfCutMM: 8.0 },
      royaltiesEarned: 450.0,
    },
  ];

  const created = [];
  for (const a of axioms) {
    const item = await prisma.knowledgeAxiom.create({
      data: a,
    });
    created.push(item);
  }

  return created;
}

export async function publishAxiom(
  organizationId: string,
  title: string,
  description: string,
  axiomType: string,
  rulesApplied: any,
) {
  return prisma.knowledgeAxiom.create({
    data: {
      organizationId,
      title,
      description,
      axiomType,
      rulesApplied,
      royaltiesEarned: 0.0,
    },
  });
}

export async function simulateZkExportClearance(
  organizationId: string,
  componentId: string,
  clearanceType: string,
) {
  const component = await prisma.engineeringEntity.findFirst({
    where: { id: componentId, organizationId },
  });

  if (!component) {
    throw new Error("Engineering entity not found");
  }

  // Redact structural details (strip out flanges and core thickness)
  const redactedGeoSpecs = {
    boundaryBox: "150mm x 120mm x 80mm",
    weightMaxKg: 2.0,
    materialClass: "Titanium Alloy",
    ITAR_ComplianceAttestation: "ZK_PROOF_VERIFIED_EXPORT_CLEAR",
  };

  const clearance = await prisma.exportClearance.create({
    data: {
      organizationId,
      componentId,
      clearanceType,
      zkProofStatus: "VERIFIED",
      redactedGeoSpecs,
    },
  });

  return clearance;
}

export async function getExportClearances(organizationId: string) {
  return prisma.exportClearance.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}
