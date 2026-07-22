import { prisma } from "@/server/db";

export async function getHumanRecords(organizationId: string) {
  const existing = await prisma.humanRecord.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (existing.length > 0) return existing;

  // Seed default human-authored records (RCAs, Failure reports, ECRs)
  const defaultRecords = [
    {
      organizationId,
      title: "RCA-2026-09: Artemis III Nozzle Weld Failure Analysis",
      sourceDocument: "RCA-2026-09.pdf",
      sentenceText:
        "Root cause of the weld micro-cracking was identified as local thermal cooling stress exceeding 420C/sec during high-heat laser sintering runs.",
      recordType: "RCA",
      authorName: "Marcus Vance (Principal Welder)",
    },
    {
      organizationId,
      title: "ECR-840: Core Propulsion Flange Thickness Change",
      sourceDocument: "ECR-840.dwg",
      sentenceText:
        "Increase propulsion flange hole diameter allowance from 0.02mm to 0.05mm to prevent mechanical thread interference during assembly fits.",
      recordType: "ECR",
      authorName: "Sarah Jenkins (Lead Stress Engineer)",
    },
    {
      organizationId,
      title: "MRB-721: Metrology Outlier Report (Combustion chamber #12)",
      sourceDocument: "MRB-721-Inspection.log",
      sentenceText:
        "Surface roughness scan deviation of 0.038mm detected on inner nozzle chamber wall under Zeiss calypso laser metrology scan.",
      recordType: "METROLOGY",
      authorName: "David Cole (Quality Inspector)",
    },
    {
      organizationId,
      title: "Failure Report: Starliner Manifold Structural Leak",
      sourceDocument: "SR-920-Failure.pdf",
      sentenceText:
        "A structural wall failure was detected at the elbow junction of manifold assembly during pressure stress-testing. Leakage rate was 0.4L/min.",
      recordType: "FAILURE",
      authorName: "John Doe (Systems Testing)",
    },
  ];

  const created = [];
  for (const r of defaultRecords) {
    const item = await prisma.humanRecord.create({ data: r });
    created.push(item);
  }

  return created;
}

export async function getProposedLinks(organizationId: string) {
  const records = await getHumanRecords(organizationId);
  const existing = await prisma.proposedLink.findMany({
    where: { organizationId },
  });

  if (existing.length > 0) return existing;

  // Let's create proposed links between our seeded records:
  // Link 1: Link MRB-721 metrology outlier to Artemis III weld failure RCA
  // Link 2: Link Failure Report (Starliner manifold) to ECR-840 thickness change
  const defaultLinks = [
    {
      organizationId,
      sourceRecordId: records[2].id,
      targetRecordId: records[0].id,
      proposedReason:
        "Engineering term match: 'weld micro-cracking' and 'metrology scan deviation' both affect thin-walled structural geometries.",
      recencyDays: 14,
      similarityScore: 0.92,
      completenessScore: 1.0,
      isAttested: false,
    },
    {
      organizationId,
      sourceRecordId: records[3].id,
      targetRecordId: records[1].id,
      proposedReason:
        "Overlapping structural assembly keywords: 'manifold assembly' and 'propulsion flange hole diameter'.",
      recencyDays: 3,
      similarityScore: 0.78,
      completenessScore: 0.85,
      isAttested: false,
    },
  ];

  const created = [];
  for (const l of defaultLinks) {
    const item = await prisma.proposedLink.create({ data: l });
    created.push(item);
  }

  return created;
}

export async function attestLink(
  organizationId: string,
  linkId: string,
  engineerName: string,
  notes: string,
) {
  const link = await prisma.proposedLink.findFirst({
    where: { id: linkId, organizationId },
  });

  if (!link) throw new Error("Proposed link not found");

  // Create audited attestation log
  await prisma.attestationRecord.create({
    data: {
      organizationId,
      linkId,
      engineerName,
      notes,
    },
  });

  // Mark the link as attested
  return prisma.proposedLink.update({
    where: { id: linkId },
    data: {
      isAttested: true,
      attestedBy: engineerName,
      attestedAt: new Date(),
    },
  });
}

export async function getValidationMilestones(organizationId: string) {
  const existing = await prisma.validationMilestone.findMany({
    where: { organizationId },
    orderBy: { startDate: "asc" },
  });

  if (existing.length > 0) return existing;

  const milestones = [
    {
      organizationId,
      stageName: "Phase 1: Records Assessment & Ingestion Setup",
      status: "COMPLETED",
      precisionPercent: 1.0,
      startDate: new Date("2026-01-01"),
      signOffDate: new Date("2026-02-15"),
      signedOffBy: "Chief Safety Officer",
    },
    {
      organizationId,
      stageName: "Phase 2: Offline Validation & Measured Precision",
      status: "ACTIVE",
      precisionPercent: 0.94,
      startDate: new Date("2026-02-16"),
    },
    {
      organizationId,
      stageName: "Phase 3: Shadowed System Use (Consultation Companion)",
      status: "PENDING",
      startDate: new Date("2026-06-01"),
    },
    {
      organizationId,
      stageName: "Phase 4: Quality Org Final Sign-off",
      status: "PENDING",
      startDate: new Date("2026-09-01"),
    },
    {
      organizationId,
      stageName: "Phase 5: Production Rollout",
      status: "PENDING",
      startDate: new Date("2026-10-01"),
    },
  ];

  const created = [];
  for (const m of milestones) {
    const item = await prisma.validationMilestone.create({ data: m });
    created.push(item);
  }

  return created;
}

export async function getConflictLogs(organizationId: string) {
  const existing = await prisma.conflictLog.findMany({
    where: { organizationId },
    orderBy: { resolvedAt: "desc" },
  });

  if (existing.length > 0) return existing;

  const conflicts = [
    {
      organizationId,
      sourceRecordId: "RCA-2026-09",
      conflictRecordId: "ECR-840",
      description:
        "Discrepancy: Weld failure analysis notes cooling limit of 420C/sec, whereas the change request sets high-heat speed bounds at 480C/sec.",
      resolutionNotes: null,
    },
  ];

  const created = [];
  for (const c of conflicts) {
    const item = await prisma.conflictLog.create({ data: c });
    created.push(item);
  }

  return created;
}

export async function resolveConflict(
  organizationId: string,
  conflictId: string,
  resolvedBy: string,
  resolutionNotes: string,
) {
  return prisma.conflictLog.update({
    where: { id: conflictId, organizationId },
    data: {
      resolutionNotes,
      resolvedBy,
      resolvedAt: new Date(),
    },
  });
}
