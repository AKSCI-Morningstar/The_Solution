/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createPrecedent,
  getPrecedentById,
  updatePrecedent,
  deletePrecedent,
  getPrecedentsBySimilarity,
} from "@/server/precedents/precedent-service";
import { prisma } from "@/server/db";

vi.mock("@/server/db", () => {
  return {
    prisma: {
      historicalPrecedent: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      historicalPrecedentVersion: {
        create: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
      supplier: {
        findMany: vi.fn(),
      },
      qualityEvent: {
        count: vi.fn(),
      },
      manufacturingEvent: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("Precedent Service", () => {
  const orgId = "org-123";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPrecedent", () => {
    it("successfully creates a new precedent and writes first version history", async () => {
      const mockInput = {
        organizationId: orgId,
        title: "Ariane 5 Software Bug",
        summary: "Software overflow error during flight module casting",
        engineeringQuestion: "Should safety-critical systems omit type cast guards?",
        decisionMade: "Mandate numeric overflow protection across all flight code",
        supportingEvidence: ["HIL Simulation A501"],
        contradictions: [],
        missingEvidence: [],
        outcome: "RESOLVED",
        lessonsLearned: "Cast guards prevent guidance loss",
        tags: ["software", "aerospace"],
        userId,
      };

      const mockCreated = {
        id: "prec-123",
        organizationId: orgId,
        title: mockInput.title,
        summary: mockInput.summary,
        engineeringQuestion: mockInput.engineeringQuestion,
        decisionMade: mockInput.decisionMade,
        supportingEvidence: mockInput.supportingEvidence,
        contradictions: mockInput.contradictions,
        missingEvidence: mockInput.missingEvidence,
        outcome: mockInput.outcome,
        lessonsLearned: mockInput.lessonsLearned,
        relatedProjects: [],
        relatedSuppliers: [],
        relatedRequirements: [],
        relatedDocuments: [],
        relatedComponents: [],
        relatedStandards: [],
        relatedCertifications: [],
        decisionDate: new Date(),
        confidence: 1.0,
        tags: mockInput.tags,
        decisionOwnerId: userId,
        auditMetadata: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.historicalPrecedent.create).mockResolvedValue(mockCreated as any);
      vi.mocked(prisma.historicalPrecedentVersion.create).mockResolvedValue({} as any);

      const result = await createPrecedent(mockInput);

      expect(prisma.historicalPrecedent.findFirst).toHaveBeenCalled();
      expect(prisma.historicalPrecedent.create).toHaveBeenCalled();
      expect(prisma.historicalPrecedentVersion.create).toHaveBeenCalled();
      expect(result.id).toBe("prec-123");
      expect(result.title).toBe("Ariane 5 Software Bug");
    });

    it("throws error if a precedent with the same title already exists", async () => {
      const mockInput = {
        organizationId: orgId,
        title: "Duplicate Precedent",
        summary: "Standard duplication test",
        engineeringQuestion: "Duplicate Question",
        decisionMade: "Duplicate Decision",
        supportingEvidence: [],
        contradictions: [],
        missingEvidence: [],
        outcome: "Duplicate Outcome",
        lessonsLearned: "Duplicate Lessons",
        tags: [],
        userId,
      };

      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue({
        id: "existing-123",
      } as any);

      await expect(createPrecedent(mockInput)).rejects.toThrow(
        'A historical precedent with the title "Duplicate Precedent" already exists.',
      );
    });
  });

  describe("getPrecedentById", () => {
    it("returns null if the precedent does not exist", async () => {
      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue(null);
      const result = await getPrecedentById("nonexistent", orgId);
      expect(result).toBeNull();
    });

    it("returns mapped precedent if found", async () => {
      const mockRecord = {
        id: "prec-123",
        organizationId: orgId,
        title: "Ariane 5 Software Bug",
        summary: "Software overflow error",
        engineeringQuestion: "Should safety-critical systems omit type cast guards?",
        decisionMade: "Mandate numeric overflow protection",
        supportingEvidence: ["HIL Simulation"],
        contradictions: [],
        missingEvidence: [],
        outcome: "RESOLVED",
        lessonsLearned: "Cast guards prevent guidance loss",
        relatedProjects: [],
        relatedSuppliers: [],
        relatedRequirements: [],
        relatedDocuments: [],
        relatedComponents: [],
        relatedStandards: [],
        relatedCertifications: [],
        decisionDate: new Date(),
        confidence: 1.0,
        tags: ["software"],
        decisionOwnerId: userId,
        auditMetadata: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        decisionOwner: {
          id: userId,
          name: "Test Engineer",
          email: "test@aksci.com",
        },
        versions: [],
      };

      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue(mockRecord as any);

      const result = await getPrecedentById("prec-123", orgId);
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Ariane 5 Software Bug");
      expect(result!.type).toBe("FAILURE");
    });
  });

  describe("updatePrecedent", () => {
    it("successfully updates fields and bumps version", async () => {
      const mockExisting = {
        id: "prec-123",
        organizationId: orgId,
        title: "Old Title",
        summary: "Old Summary",
        engineeringQuestion: "Question",
        decisionMade: "Old Decision",
        supportingEvidence: [],
        contradictions: [],
        missingEvidence: [],
        outcome: "RESOLVED",
        lessonsLearned: "Lessons",
        relatedProjects: [],
        relatedSuppliers: [],
        relatedRequirements: [],
        relatedDocuments: [],
        relatedComponents: [],
        relatedStandards: [],
        relatedCertifications: [],
        decisionDate: new Date(),
        confidence: 1.0,
        tags: [],
        decisionOwnerId: userId,
        auditMetadata: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        versions: [{ id: "v1", version: 1, createdAt: new Date() }],
      };

      const mockUpdated = {
        ...mockExisting,
        title: "New Title",
        updatedAt: new Date(),
      };

      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.historicalPrecedent.update).mockResolvedValue(mockUpdated as any);
      vi.mocked(prisma.historicalPrecedentVersion.create).mockResolvedValue({} as any);

      const result = await updatePrecedent("prec-123", orgId, {
        title: "New Title",
        changeDescription: "Bumping title",
        userId,
      });

      expect(prisma.historicalPrecedent.update).toHaveBeenCalled();
      expect(prisma.historicalPrecedentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            changeDescription: "Bumping title",
          }),
        }),
      );
      expect(result.title).toBe("New Title");
    });
  });

  describe("deletePrecedent", () => {
    it("successfully soft-deletes a precedent", async () => {
      const mockRecord = {
        id: "prec-123",
        organizationId: orgId,
        title: "Precedent to delete",
        auditMetadata: [],
      };

      vi.mocked(prisma.historicalPrecedent.findFirst).mockResolvedValue(mockRecord as any);
      vi.mocked(prisma.historicalPrecedent.update).mockResolvedValue({} as any);

      const result = await deletePrecedent("prec-123", orgId, userId);
      expect(result).toBe(true);
      expect(prisma.historicalPrecedent.update).toHaveBeenCalledWith({
        where: { id: "prec-123" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getPrecedentsBySimilarity", () => {
    it("calculates similarity scores based on Jaccard/weighted overlap", async () => {
      const mockRecords = [
        {
          id: "prec-1",
          organizationId: orgId,
          title: "Bolt Stress Fractures",
          summary: "Titanium alloy fastener shear stress cracking under tension",
          engineeringQuestion: "Crevice crack limit",
          decisionMade: "Mandated Super Duplex fasteners",
          supportingEvidence: [],
          contradictions: [],
          missingEvidence: [],
          outcome: "RESOLVED",
          lessonsLearned: "Crevices suffer stress corrosion",
          relatedProjects: [],
          relatedSuppliers: ["Alpha Bolt"],
          relatedRequirements: [],
          relatedDocuments: [],
          relatedComponents: ["Fasteners", "Structural Joints"],
          relatedStandards: ["ISO 898"],
          relatedCertifications: [],
          decisionDate: new Date(),
          confidence: 1.0,
          tags: ["mechanical", "metallurgy"],
          decisionOwnerId: userId,
          auditMetadata: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: "prec-2",
          organizationId: orgId,
          title: "Guidance Module Cast Error",
          summary: "Calculation overflows",
          engineeringQuestion: "Operand checks",
          decisionMade: "Mandated software casting guards",
          supportingEvidence: [],
          contradictions: [],
          missingEvidence: [],
          outcome: "RESOLVED",
          lessonsLearned: "Guards prevent crash",
          relatedProjects: [],
          relatedSuppliers: [],
          relatedRequirements: [],
          relatedDocuments: [],
          relatedComponents: ["Guidance & Control"],
          relatedStandards: ["DO-178C"],
          relatedCertifications: [],
          decisionDate: new Date(),
          confidence: 1.0,
          tags: ["software", "embedded"],
          decisionOwnerId: userId,
          auditMetadata: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      vi.mocked(prisma.historicalPrecedent.count).mockResolvedValue(2);
      vi.mocked(prisma.historicalPrecedent.findMany).mockResolvedValue(mockRecords as any);
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([
        { id: "sup-1", name: "Alpha Bolt" },
      ] as any);
      vi.mocked(prisma.qualityEvent.count).mockResolvedValue(0);
      vi.mocked(prisma.manufacturingEvent.findMany).mockResolvedValue([] as any);

      // Context matching Bolt Fasteners, Supplier Alpha Bolt and ISO 898
      const context = {
        question: "Can we use fastener fasteners from supplier Alpha Bolt?",
        componentName: "Fasteners",
        suppliers: ["Alpha Bolt"],
        standards: ["ISO 898"],
      };

      const result = await getPrecedentsBySimilarity(orgId, context);

      // Result should have prec-1 as top match due to shared suppliers, components, and standards
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe("prec-1");
      expect(result[0].similarityScore).toBeGreaterThan(50);
      expect(result[0].matchExplanation).toContain("Shared supplier connection: Alpha Bolt");
      expect(result[0].matchExplanation).toContain(
        'Mating system or component matches: "Fasteners"',
      );
      expect(result[0].matchExplanation).toContain(
        "Governed by same engineering standards: ISO 898",
      );
    });
  });
});
