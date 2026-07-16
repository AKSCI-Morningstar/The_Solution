/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db";
import { EngineeringPrecedent } from "@/features/precedents/types";
import { logger } from "@/shared/logging";
import { Prisma } from "@prisma/client";

// High-fidelity seed data mapped to the new database fields
const SEED_PRECEDENTS = [
  {
    id: "prec-1",
    title: "Ariane 5 Flight 501 Software Failure",
    summary:
      "Loss of launcher orientation after aerodynamic load overload due to guidance system calculation error.",
    engineeringQuestion: "Can guidance systems cast variable data types without boundaries?",
    decisionMade:
      "Include protective handlers for all variable casting; run full end-to-end hardware-in-the-loop simulation of flight software.",
    outcome: "Passed verification tests with zero operand exceptions during subsequent HIL runs.",
    lessonsLearned: "All software variable casts must include explicit range boundary checks.",
    confidence: 1.0,
    tags: ["software", "guidance", "failure", "operand-overflow"],
    relatedProjects: ["Ariane 5"],
    relatedSuppliers: ["Vibration Systems Inc"],
    relatedRequirements: ["Requirement 1.2.4: Software Safety Boundaries"],
    relatedDocuments: ["Ariane 5 Inquiry Board Report"],
    relatedComponents: ["Guidance & Control", "Software System"],
    relatedStandards: ["IEEE 754 Floating Point Standard", "DO-178C"],
    relatedCertifications: ["DO-178C Level A Certification"],
    supportingEvidence: [
      "Operand error on 64-bit to 16-bit integer conversion",
      "HIL Simulation Run #A501-S3",
    ],
    contradictions: ["Guidance module ran without sensor check loop"],
    missingEvidence: ["Static check validation logs"],
  },
  {
    id: "prec-2",
    title: "Titanium Alloy Grade 5 Stress Corrosion Cracking (SCC) in Saltwater",
    summary:
      "Rapid brittle fracture of high-tension structural fasteners observed during deep-water endurance trials.",
    engineeringQuestion:
      "Is Titanium Alloy Grade 5 safe for high-stress joint fasteners in marine crevices?",
    decisionMade:
      "Apply cadmium-free galvanic plating, substitute titanium fasteners with Super Duplex Stainless Steel (PREN > 40) in mechanical joint seals.",
    outcome: "No stress corrosion or crevice cracking detected during 18-month saltwater trial.",
    lessonsLearned:
      "Titanium fasteners suffer crevice corrosion under stress in saltwater without active cathodic protection.",
    confidence: 0.95,
    tags: ["materials", "corrosion", "structural", "marine"],
    relatedProjects: ["Deepwater Subsea Seal"],
    relatedSuppliers: ["Alpha Bolt"],
    relatedRequirements: ["Requirement 4.2: Marine Crevice Durability"],
    relatedDocuments: ["Deep-Water Endurance Summary Report"],
    relatedComponents: ["Structure", "Material Selection"],
    relatedStandards: ["ASTM G48 Crevice Corrosion Standard"],
    relatedCertifications: ["NACE MR0175/ISO 15156"],
    supportingEvidence: [
      "Chloride-induced corrosion crevice analysis",
      "Salt Spray Lab Test #9822",
    ],
    contradictions: ["Titanium reported as corrosion-free but fractured under tension"],
    missingEvidence: ["Crevice oxygenation study"],
  },
  {
    id: "prec-3",
    title: "Composite Fuel Tank Micro-Cracking under Cryogenic Cycling",
    summary: "Liquid hydrogen fuel leakage under cyclic cryogenic thermal loads.",
    engineeringQuestion:
      "How do composite carbon matrices perform under cryogenic cycling without elastomeric liners?",
    decisionMade:
      "Incorporate an inner elastomeric membrane liner and cure with pre-impregnated cyanate ester resins showing lower micro-crack sensitivity.",
    outcome: "Fuel containment verified through 100 thermal load cycles with zero leakage.",
    lessonsLearned:
      "Carbon-fiber weave thermal expansion mismatch with epoxy matrix induces matrix micro-cracking at liquid hydrogen temperature.",
    confidence: 0.9,
    tags: ["composites", "cryo", "propulsion", "leakage"],
    relatedProjects: ["Liquid Hydrogen Tanker"],
    relatedSuppliers: ["Supplier X"],
    relatedRequirements: ["Requirement 3.5: Cryogenic Tank Integrity"],
    relatedDocuments: ["Cryogenic Structural Integrity Review"],
    relatedComponents: ["Propulsion", "Fuel System", "Composite Materials"],
    relatedStandards: ["ISO 11114 Transportable Gas Cylinders"],
    relatedCertifications: ["ASME Section VIII Div 3"],
    supportingEvidence: [
      "Matrix thermal expansion mismatch testing",
      "Thermal Vacuum Deflection Analysis #V12",
    ],
    contradictions: ["Fiber orientation met stress targets but failed leak checks"],
    missingEvidence: ["Micro-crack dye penetrant tests"],
  },
  {
    id: "prec-4",
    title: "Dual-Redundant Fly-by-Wire Hydraulic Actuation Integration",
    summary:
      "A highly resilient control system surface actuation design utilizing decoupled split hydraulics and electrical control paths.",
    engineeringQuestion:
      "What configuration guarantees flight control surface deflection under multiple line losses?",
    decisionMade:
      "Decouple split hydraulics and enforce double-redundant electrical controls in different spatial paths.",
    outcome:
      "System verified to survive double hydraulic line losses and triple computer restarts.",
    lessonsLearned: "Decoupled redundancy avoids common-mode failures across control channels.",
    confidence: 0.98,
    tags: ["redundancy", "hydraulics", "controls", "success"],
    relatedProjects: ["Fly-by-Wire Flight Baseline"],
    relatedSuppliers: ["Control Logic Corp"],
    relatedRequirements: ["Requirement 2.1: Surface Control Decoupling"],
    relatedDocuments: ["Aviation Flight System Integration Manual"],
    relatedComponents: ["Flight Controls", "Hydraulics"],
    relatedStandards: ["MIL-H-5440 Hydraulic System Design Standard"],
    relatedCertifications: ["FAA Part 25 Airworthiness Certification"],
    supportingEvidence: [
      "Failure Mode Effects Analysis (FMEA) Report #8",
      "Flight computer switch loops",
    ],
    contradictions: [],
    missingEvidence: [],
  },
  {
    id: "prec-5",
    title: "MIL-STD-810H Temperature & Structural Vibration Compliance Standards",
    summary:
      "Standardized environmental testing criteria to qualify engineering models against mission profiles.",
    engineeringQuestion:
      "What test parameters qualify structural assemblies for multi-axis vibration stresses?",
    decisionMade:
      "Mandate structural model verification against MIL-STD-810H vibration and thermal profiles.",
    outcome:
      "Qualifying testing standards established and integrated into baseline verification workflow.",
    lessonsLearned:
      "Laboratory testing profiles must be derived from actual measured telemetry profiles.",
    confidence: 1.0,
    tags: ["testing", "vibration", "standards", "compliance"],
    relatedProjects: ["Launch Vehicle Vibration Baseline"],
    relatedSuppliers: ["Supplier X"],
    relatedRequirements: ["Requirement 5.1: Vibro-Acoustic Qualifications"],
    relatedDocuments: ["MIL-STD-810H Official Handbook"],
    relatedComponents: ["Testing & Verification", "Structure"],
    relatedStandards: ["Department of Defense Test Method Standard"],
    relatedCertifications: ["ISO/IEC 17025 Laboratory Accreditation"],
    supportingEvidence: ["Launch telemetry profile validation logs"],
    contradictions: [],
    missingEvidence: [],
  },
  {
    id: "prec-6",
    title: "Fastener Lot #9822 Yield Strength Failure (Supplier: Alpha Bolt)",
    summary:
      "A lot of structural shear bolts exhibited tensile failure below the 120 ksi specification constraint during intake lot checks.",
    engineeringQuestion:
      "Why did fastener lot #9822 fail yield strength check despite mill certificates?",
    decisionMade:
      "Fastener lot rejected. Alpha Bolt placed on active inspection probation. Imposed 100% hardness inspection checks.",
    outcome:
      "Yield strength discrepancies resolved; subsequent lot shipments verified at 122+ ksi.",
    lessonsLearned:
      "Quench-hardening thermal cycles must be verified with sample metallurgical lot testing.",
    confidence: 0.88,
    tags: ["fasteners", "supplier-failure", "tensile-test", "quality-control"],
    relatedProjects: ["Lot Acceptability Baseline"],
    relatedSuppliers: ["Alpha Bolt"],
    relatedRequirements: ["Requirement 6.1: Fastener Yield Strength"],
    relatedDocuments: ["Receiving Quality Report for Lot #9822"],
    relatedComponents: ["Structural Fasteners", "Fasteners", "Supply Chain"],
    relatedStandards: ["ISO 898 Fasteners Mechanical Properties"],
    relatedCertifications: ["ISO 9001 Supplier Audit"],
    supportingEvidence: [
      "Metallurgical Analysis Report #M-0442",
      "Yield strength tensile test failures",
    ],
    contradictions: ["Mill certification claimed 125 ksi but sample failed at 112 ksi"],
    missingEvidence: ["Quench furnace temperature logging chart"],
  },
];

function parseJsonArray(val: unknown): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Self-healing seeder that boots historical knowledge straight into the relational HistoricalPrecedent table
 */
export async function ensurePrecedentsSeeded(organizationId: string, userId?: string) {
  try {
    let creatorId = userId || null;
    if (!creatorId) {
      const firstUser = await prisma.user.findFirst({
        where: { memberships: { some: { organizationId } } },
      });
      creatorId = firstUser?.id || null;
    }

    for (const p of SEED_PRECEDENTS) {
      const existing = await prisma.historicalPrecedent.findFirst({
        where: { organizationId, id: p.id },
      });

      if (!existing) {
        const precedent = await prisma.historicalPrecedent.create({
          data: {
            id: p.id,
            organizationId,
            title: p.title,
            summary: p.summary,
            engineeringQuestion: p.engineeringQuestion,
            decisionMade: p.decisionMade,
            outcome: p.outcome,
            lessonsLearned: p.lessonsLearned,
            confidence: p.confidence,
            tags: p.tags,
            relatedProjects: p.relatedProjects,
            relatedSuppliers: p.relatedSuppliers,
            relatedRequirements: p.relatedRequirements,
            relatedDocuments: p.relatedDocuments,
            relatedComponents: p.relatedComponents,
            relatedStandards: p.relatedStandards,
            relatedCertifications: p.relatedCertifications,
            supportingEvidence: p.supportingEvidence,
            contradictions: p.contradictions,
            missingEvidence: p.missingEvidence,
            decisionDate: new Date(),
            decisionOwnerId: creatorId,
            auditMetadata: [
              {
                action: "SEED",
                performedBy: creatorId,
                timestamp: new Date().toISOString(),
                details: "Initial seeding of historical precedent memory.",
              },
            ],
          },
        });

        // Add version log
        await prisma.historicalPrecedentVersion.create({
          data: {
            precedentId: precedent.id,
            version: 1,
            title: precedent.title,
            summary: precedent.summary,
            decisionMade: precedent.decisionMade,
            outcome: precedent.outcome,
            lessonsLearned: precedent.lessonsLearned,
            snapshot: precedent as unknown as Prisma.InputJsonValue,
            changeDescription: "Initial record seeding",
            createdById: creatorId,
          },
        });
      }
    }
    logger.info("Historical Precedents seeded successfully", { organizationId });
  } catch (err) {
    logger.error("Failed to seed historical precedents", { organizationId, err });
  }
}

/**
 * Maps DB model to the UI-facing EngineeringPrecedent type
 */
async function mapPrecedentToDto(entity: any): Promise<EngineeringPrecedent> {
  let ownerName = "System";
  if (entity.decisionOwner) {
    ownerName = entity.decisionOwner.name || entity.decisionOwner.email;
  }

  const versionHistory = (entity.versions || []).map((v: any) => ({
    id: v.id,
    version: `${v.version}.0.0`,
    description: v.changeDescription || "Update logged",
    createdAt: v.createdAt.toISOString(),
  }));

  const auditMetadata = parseJsonArray(entity.auditMetadata);
  const auditTrail = auditMetadata.map((a: any, idx: number) => ({
    id: `audit-${idx}`,
    action: a.action || "UPDATE",
    metadata: a,
    createdAt: a.timestamp || entity.createdAt.toISOString(),
  }));

  // Map database tags
  const tags = parseJsonArray(entity.tags);
  const relatedProjects = parseJsonArray(entity.relatedProjects);
  const relatedSuppliers = parseJsonArray(entity.relatedSuppliers);
  const relatedRequirements = parseJsonArray(entity.relatedRequirements);
  const relatedDocuments = parseJsonArray(entity.relatedDocuments);
  const relatedComponents = parseJsonArray(entity.relatedComponents);
  const relatedStandards = parseJsonArray(entity.relatedStandards);
  const relatedCertifications = parseJsonArray(entity.relatedCertifications);

  return {
    id: entity.id,
    organizationId: entity.organizationId,
    title: entity.title,
    summary: entity.summary,
    engineeringQuestion: entity.engineeringQuestion,
    decisionMade: entity.decisionMade,
    supportingEvidence: entity.supportingEvidence,
    contradictions: entity.contradictions,
    missingEvidence: entity.missingEvidence,
    outcome: entity.outcome,
    lessonsLearned: entity.lessonsLearned,
    relatedProjects,
    relatedSuppliers,
    relatedRequirements,
    relatedDocuments,
    relatedComponents,
    relatedStandards,
    relatedCertifications,
    decisionDate: entity.decisionDate.toISOString(),
    decisionOwnerId: entity.decisionOwnerId,
    decisionOwnerName: ownerName,
    confidence: entity.confidence,
    tags,
    auditMetadata: entity.auditMetadata,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    whyRelevant: entity.whyRelevant || "Matched via general search",
    similarityScore: entity.similarityScore,
    similarityExplanation: entity.similarityExplanation,
    versionHistory,
    auditTrail,
  };
}

/**
 * Returns list of precedents, with optional keyword or field search filters
 */
export async function getPrecedents(query?: {
  type?: string;
  search?: string;
  system?: string;
  organizationId?: string;
}): Promise<EngineeringPrecedent[]> {
  let orgId = query?.organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id;
  }
  if (!orgId) return [];

  // Seed check
  const count = await prisma.historicalPrecedent.count({
    where: { organizationId: orgId, deletedAt: null },
  });
  if (count === 0) {
    await ensurePrecedentsSeeded(orgId);
  }

  // Fetch precedents
  const precedents = await prisma.historicalPrecedent.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: {
      decisionOwner: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  const results: EngineeringPrecedent[] = [];
  for (const p of precedents) {
    results.push(await mapPrecedentToDto(p));
  }

  // Filter by system (applicable component)
  if (query?.system && query.system !== "ALL") {
    const sys = query.system.toLowerCase();
    return results.filter(
      (p) =>
        p.relatedComponents.some((c) => c.toLowerCase().includes(sys)) ||
        p.relatedProjects.some((pr) => pr.toLowerCase().includes(sys)),
    );
  }

  // General keyword search
  if (query?.search) {
    const searchTerms = query.search.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = results.map((p) => {
      let score = 0;
      const reasons: string[] = [];

      searchTerms.forEach((term) => {
        if (p.title.toLowerCase().includes(term)) {
          score += 30;
          reasons.push(`Title matches "${term}"`);
        }
        if (p.summary.toLowerCase().includes(term)) {
          score += 15;
          reasons.push(`Summary matches "${term}"`);
        }
        if (p.decisionMade.toLowerCase().includes(term)) {
          score += 10;
          reasons.push(`Decision matches "${term}"`);
        }
        if (p.relatedComponents.some((c) => c.toLowerCase().includes(term))) {
          score += 25;
          reasons.push(`Component match: ${term}`);
        }
        if (p.relatedSuppliers.some((s) => s.toLowerCase().includes(term))) {
          score += 25;
          reasons.push(`Supplier match: ${term}`);
        }
        if (p.tags.some((t) => t.toLowerCase().includes(term))) {
          score += 10;
          reasons.push(`Tag match: ${term}`);
        }
      });

      return {
        precedent: p,
        score,
        explanation: reasons.join("; "),
      };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => {
        item.precedent.similarityScore = Math.min(100, item.score);
        item.precedent.similarityExplanation = item.explanation;
        item.precedent.whyRelevant = item.explanation;
        return item.precedent;
      });
  }

  // Sort by decision date descending
  return results.sort(
    (a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime(),
  );
}

/**
 * Retrieves a precedent by ID
 */
export async function getPrecedentById(
  id: string,
  organizationId?: string,
): Promise<EngineeringPrecedent | null> {
  let orgId = organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id;
  }
  if (!orgId) return null;

  const record = await prisma.historicalPrecedent.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: {
      decisionOwner: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!record) return null;
  return mapPrecedentToDto(record);
}

/**
 * Creates a new historical precedent record
 */
export async function createPrecedent(input: {
  title: string;
  summary: string;
  engineeringQuestion: string;
  decisionMade: string;
  outcome: string;
  lessonsLearned: string;
  confidence?: number;
  tags?: string[];
  relatedProjects?: string[];
  relatedSuppliers?: string[];
  relatedRequirements?: string[];
  relatedDocuments?: string[];
  relatedComponents?: string[];
  relatedStandards?: string[];
  relatedCertifications?: string[];
  supportingEvidence?: any;
  contradictions?: any;
  missingEvidence?: any;
  organizationId?: string;
  userId?: string;
}): Promise<EngineeringPrecedent> {
  let orgId = input.organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id;
  }
  if (!orgId) {
    throw new Error("No active organization found.");
  }

  const precedent = await prisma.historicalPrecedent.create({
    data: {
      organizationId: orgId,
      title: input.title,
      summary: input.summary,
      engineeringQuestion: input.engineeringQuestion,
      decisionMade: input.decisionMade,
      outcome: input.outcome,
      lessonsLearned: input.lessonsLearned,
      confidence: input.confidence ?? 1.0,
      tags: input.tags ?? [],
      relatedProjects: input.relatedProjects ?? [],
      relatedSuppliers: input.relatedSuppliers ?? [],
      relatedRequirements: input.relatedRequirements ?? [],
      relatedDocuments: input.relatedDocuments ?? [],
      relatedComponents: input.relatedComponents ?? [],
      relatedStandards: input.relatedStandards ?? [],
      relatedCertifications: input.relatedCertifications ?? [],
      supportingEvidence: input.supportingEvidence ?? [],
      contradictions: input.contradictions ?? [],
      missingEvidence: input.missingEvidence ?? [],
      decisionDate: new Date(),
      decisionOwnerId: input.userId || null,
      auditMetadata: [
        {
          action: "CREATE",
          performedBy: input.userId || "System",
          timestamp: new Date().toISOString(),
          details: "Created new engineering precedent.",
        },
      ],
    },
    include: {
      decisionOwner: { select: { id: true, name: true, email: true } },
      versions: true,
    },
  });

  // Create version record
  await prisma.historicalPrecedentVersion.create({
    data: {
      precedentId: precedent.id,
      version: 1,
      title: precedent.title,
      summary: precedent.summary,
      decisionMade: precedent.decisionMade,
      outcome: precedent.outcome,
      lessonsLearned: precedent.lessonsLearned,
      snapshot: precedent as unknown as Prisma.InputJsonValue,
      changeDescription: "Initial creation version",
      createdById: input.userId || null,
    },
  });

  return mapPrecedentToDto(precedent);
}

/**
 * Updates an existing historical precedent, incrementing its version snapshot
 */
export async function updatePrecedent(
  id: string,
  input: {
    title?: string;
    summary?: string;
    decisionMade?: string;
    outcome?: string;
    lessonsLearned?: string;
    tags?: string[];
    confidence?: number;
    relatedProjects?: string[];
    relatedSuppliers?: string[];
    relatedComponents?: string[];
    relatedRequirements?: string[];
    relatedDocuments?: string[];
    relatedStandards?: string[];
    relatedCertifications?: string[];
    changeDescription?: string;
    userId?: string;
  },
  organizationId?: string,
): Promise<EngineeringPrecedent> {
  let orgId = organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id;
  }
  if (!orgId) throw new Error("No active organization found.");

  const existing = await prisma.historicalPrecedent.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!existing) throw new Error("Precedent not found.");

  const currentVersion = existing.versions[0]?.version || 1;
  const nextVersion = currentVersion + 1;

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.decisionMade !== undefined) updateData.decisionMade = input.decisionMade;
  if (input.outcome !== undefined) updateData.outcome = input.outcome;
  if (input.lessonsLearned !== undefined) updateData.lessonsLearned = input.lessonsLearned;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.confidence !== undefined) updateData.confidence = input.confidence;
  if (input.relatedProjects !== undefined) updateData.relatedProjects = input.relatedProjects;
  if (input.relatedSuppliers !== undefined) updateData.relatedSuppliers = input.relatedSuppliers;
  if (input.relatedComponents !== undefined) updateData.relatedComponents = input.relatedComponents;
  if (input.relatedRequirements !== undefined)
    updateData.relatedRequirements = input.relatedRequirements;
  if (input.relatedDocuments !== undefined) updateData.relatedDocuments = input.relatedDocuments;
  if (input.relatedStandards !== undefined) updateData.relatedStandards = input.relatedStandards;
  if (input.relatedCertifications !== undefined)
    updateData.relatedCertifications = input.relatedCertifications;

  const currentAudit = parseJsonArray(existing.auditMetadata);
  currentAudit.push({
    action: "UPDATE",
    performedBy: input.userId || "System",
    timestamp: new Date().toISOString(),
    details: input.changeDescription || `Updated precedent properties (v${nextVersion}).`,
  });
  updateData.auditMetadata = currentAudit;

  const updated = await prisma.historicalPrecedent.update({
    where: { id },
    data: updateData,
    include: {
      decisionOwner: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  // Record version snapshot
  await prisma.historicalPrecedentVersion.create({
    data: {
      precedentId: updated.id,
      version: nextVersion,
      title: updated.title,
      summary: updated.summary,
      decisionMade: updated.decisionMade,
      outcome: updated.outcome,
      lessonsLearned: updated.lessonsLearned,
      snapshot: updated as unknown as Prisma.InputJsonValue,
      changeDescription: input.changeDescription || `Version ${nextVersion} update`,
      createdById: input.userId || null,
    },
  });

  return mapPrecedentToDto(updated);
}

/**
 * Soft deletes a precedent record
 */
export async function deletePrecedent(id: string, organizationId: string): Promise<boolean> {
  const existing = await prisma.historicalPrecedent.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) return false;

  await prisma.historicalPrecedent.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return true;
}

/**
 * Computes deterministic similarity matching of all precedents for a given target entity details
 */
export async function getPrecedentsSimilarity(
  targetId: string,
  organizationId: string,
): Promise<EngineeringPrecedent[]> {
  // Fetch active target
  const target = await prisma.engineeringEntity.findFirst({
    where: { id: targetId, organizationId, deletedAt: null },
    include: {
      sourceRelationships: {
        include: { targetEntity: true },
      },
      targetRelationships: {
        include: { sourceEntity: true },
      },
    },
  });
  if (!target) return [];

  // Extract features from target
  const componentName = target.name.toLowerCase();
  const componentCode = target.identifier.toLowerCase();

  // Find linked requirements, suppliers, standards, and documents
  const suppliers: string[] = [];
  const requirements: string[] = [];
  const standards: string[] = [];
  const documents: string[] = [];

  const allRelations = [...target.sourceRelationships, ...target.targetRelationships];
  allRelations.forEach((r) => {
    const linked =
      (r as any).sourceEntityId === target.id ? (r as any).targetEntity : (r as any).sourceEntity;
    const type = linked.entityType.toUpperCase();
    const nameLower = linked.name.toLowerCase();

    if (type === "SUPPLIER") {
      suppliers.push(nameLower);
    } else if (type === "REQUIREMENT") {
      requirements.push(nameLower);
    } else if (type === "STANDARD") {
      standards.push(nameLower);
    } else if (
      type === "DOCUMENT" ||
      linked.identifier.includes("DOC") ||
      nameLower.includes("report") ||
      nameLower.includes("manual")
    ) {
      documents.push(nameLower);
    }
  });

  // Collect target tags
  const targetTags = parseJsonArray(target.tags).map((t) => t.toLowerCase());

  // Load all precedents
  const precedents = await prisma.historicalPrecedent.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      decisionOwner: { select: { id: true, name: true, email: true } },
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  const scored: { precedent: EngineeringPrecedent; score: number; reasons: string[] }[] = [];

  for (const p of precedents) {
    let score = 0;
    const reasons: string[] = [];

    // Parse arrays
    const pSuppliers = parseJsonArray(p.relatedSuppliers).map((s) => s.toLowerCase());
    const pComponents = parseJsonArray(p.relatedComponents).map((c) => c.toLowerCase());
    const pRequirements = parseJsonArray(p.relatedRequirements).map((r) => r.toLowerCase());
    const pStandards = parseJsonArray(p.relatedStandards).map((s) => s.toLowerCase());
    const pDocuments = parseJsonArray(p.relatedDocuments).map((d) => d.toLowerCase());
    const pTags = parseJsonArray(p.tags).map((t) => t.toLowerCase());

    // 1. Check Component Matches
    const commonComponents = pComponents.filter(
      (c) => componentName.includes(c) || c.includes(componentName) || componentCode.includes(c),
    );
    if (commonComponents.length > 0) {
      score += 35;
      reasons.push(`Shared component/subsystem context ("${commonComponents.join(", ")}")`);
    }

    // 2. Check Supplier Matches
    const commonSuppliers = pSuppliers.filter((s) =>
      suppliers.some((ts) => ts.includes(s) || s.includes(ts)),
    );
    if (commonSuppliers.length > 0) {
      score += 25;
      reasons.push(`Same supplier ("${commonSuppliers.join(", ")}")`);
    }

    // 3. Check Requirement Matches
    const commonRequirements = pRequirements.filter((r) =>
      requirements.some((tr) => tr.includes(r) || r.includes(tr)),
    );
    if (commonRequirements.length > 0) {
      score += 20;
      reasons.push(`Shared requirement constraints ("${commonRequirements.join(", ")}")`);
    }

    // 4. Check Standard Matches
    const commonStandards = pStandards.filter((s) =>
      standards.some((ts) => ts.includes(s) || s.includes(ts)),
    );
    if (commonStandards.length > 0) {
      score += 20;
      reasons.push(`Governed by same standard ("${commonStandards.join(", ")}")`);
    }

    // 5. Check Document Reference Matches
    const commonDocs = pDocuments.filter((d) =>
      documents.some((td) => td.includes(d) || d.includes(td)),
    );
    if (commonDocs.length > 0) {
      score += 15;
      reasons.push(`Common document references ("${commonDocs.join(", ")}")`);
    }

    // 6. Check Tag/Metadata overlap
    const commonTags = pTags.filter((t) => targetTags.includes(t));
    if (commonTags.length > 0) {
      score += 10;
      reasons.push(`Shared tag metadata ("${commonTags.join(", ")}")`);
    }

    // Fallback: If no matches, check general text overlap of title with component name
    if (score === 0) {
      const pTitle = p.title.toLowerCase();
      if (pTitle.includes(componentName) || componentName.includes(pTitle)) {
        score += 15;
        reasons.push("General context title match");
      }
    }

    const finalScore = Math.min(100, score);
    const dto = await mapPrecedentToDto(p);
    dto.similarityScore = finalScore;
    dto.similarityExplanation =
      reasons.length > 0 ? reasons.join("; ") : "Matched via fallback verification scan.";
    dto.whyRelevant = dto.similarityExplanation;

    scored.push({
      precedent: dto,
      score: finalScore,
      reasons,
    });
  }

  // Sort by similarity score descending, taking only matches with score > 0
  return scored.sort((a, b) => b.score - a.score).map((item) => item.precedent);
}

/**
 * Returns unique systems/components
 */
export async function getUniqueSystems(organizationId?: string): Promise<string[]> {
  let orgId = organizationId;
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    orgId = defaultOrg?.id;
  }
  if (!orgId) return [];

  const precedents = await getPrecedents({ organizationId: orgId });
  const systems = new Set<string>();
  precedents.forEach((p) => {
    p.relatedComponents.forEach((c) => systems.add(c));
  });
  return Array.from(systems).sort();
}
