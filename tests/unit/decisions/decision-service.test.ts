/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createDecision,
  updateDecision,
  finalizeDecision,
} from "@/server/decisions/decision-service";
import { prisma } from "@/server/db";
import { ValidationError } from "@/shared/errors";
import { createPrecedent } from "@/server/precedents/precedent-service";

// Mock the db
vi.mock("@/server/db", () => {
  return {
    prisma: {
      decision: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      engineeringEntity: {
        findFirst: vi.fn(),
      },
    },
  };
});

// Mock the precedent service
vi.mock("@/server/precedents/precedent-service", () => {
  return {
    createPrecedent: vi.fn(),
  };
});

describe("Decision Service", () => {
  const orgId = "org-123";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDecision", () => {
    it("successfully creates a new decision in INTAKE status", async () => {
      const mockCreated = {
        id: "dec-123",
        organizationId: orgId,
        question: "Can we use Supplier X?",
        context: "Evaluation request",
        status: "INTAKE",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(prisma.decision.create).mockResolvedValue(mockCreated as any);

      const result = await createDecision({
        question: "Can we use Supplier X?",
        context: "Evaluation request",
        organizationId: orgId,
      });

      expect(prisma.decision.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          question: "Can we use Supplier X?",
          context: "Evaluation request",
          status: "INTAKE",
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it("throws ValidationError if question is missing", async () => {
      await expect(
        createDecision({
          question: "",
          organizationId: orgId,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("updateDecision", () => {
    it("successfully updates decision details in INTAKE state", async () => {
      const mockExisting = {
        id: "dec-123",
        organizationId: orgId,
        question: "Can we use Supplier X?",
        status: "INTAKE",
        deletedAt: null,
      };

      const mockUpdated = {
        ...mockExisting,
        status: "EVIDENCE_REVIEW",
        subjectEntityId: "ent-456",
        supportingEvidence: [{ label: "Mill Cert" }],
      };

      vi.mocked(prisma.decision.findFirst).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.decision.update).mockResolvedValue(mockUpdated as any);

      const result = await updateDecision("dec-123", orgId, {
        status: "EVIDENCE_REVIEW",
        subjectEntityId: "ent-456",
        supportingEvidence: [{ label: "Mill Cert" }],
      });

      expect(prisma.decision.update).toHaveBeenCalledWith({
        where: { id: "dec-123" },
        data: {
          status: "EVIDENCE_REVIEW",
          subjectEntityId: "ent-456",
          supportingEvidence: [{ label: "Mill Cert" }],
          contradictions: undefined,
          unresolvedGaps: undefined,
          precedents: undefined,
          finalDecision: undefined,
          rationale: undefined,
        },
      });
      expect(result.status).toBe("EVIDENCE_REVIEW");
    });

    it("throws ValidationError if status is finalized directly", async () => {
      const mockExisting = {
        id: "dec-123",
        organizationId: orgId,
        status: "INTAKE",
        deletedAt: null,
      };

      vi.mocked(prisma.decision.findFirst).mockResolvedValue(mockExisting as any);

      await expect(
        updateDecision("dec-123", orgId, {
          status: "FINALIZED",
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("finalizeDecision", () => {
    it("locks decision status, adds rationale, and registers precedent", async () => {
      const mockExisting = {
        id: "dec-123",
        organizationId: orgId,
        question: "Can we use Supplier X?",
        status: "EVIDENCE_REVIEW",
        subjectEntityId: "ent-456",
        supportingEvidence: [],
        contradictions: [],
        unresolvedGaps: [],
        deletedAt: null,
      };

      const mockFinalized = {
        ...mockExisting,
        status: "FINALIZED",
        finalDecision: "Approved",
        rationale: "Rationale text",
        finalizedAt: new Date(),
        finalizedById: userId,
      };

      vi.mocked(prisma.decision.findFirst).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.decision.update).mockResolvedValue(mockFinalized as any);
      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(null);
      vi.mocked(createPrecedent).mockResolvedValue({} as any);

      const result = await finalizeDecision("dec-123", orgId, userId, "Approved", "Rationale text");

      expect(prisma.decision.update).toHaveBeenCalledWith({
        where: { id: "dec-123" },
        data: {
          status: "FINALIZED",
          finalDecision: "Approved",
          rationale: "Rationale text",
          finalizedAt: expect.any(Date),
          finalizedById: userId,
        },
      });
      expect(createPrecedent).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionMade: "Approved",
          summary: "Rationale text",
          engineeringQuestion: "Can we use Supplier X?",
        }),
      );
      expect(result.status).toBe("FINALIZED");
    });

    it("throws ValidationError if finalDecision text is missing", async () => {
      const mockExisting = {
        id: "dec-123",
        organizationId: orgId,
        status: "EVIDENCE_REVIEW",
        deletedAt: null,
      };

      vi.mocked(prisma.decision.findFirst).mockResolvedValue(mockExisting as any);

      await expect(
        finalizeDecision("dec-123", orgId, userId, "", "Rationale text"),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError if rationale text is missing", async () => {
      const mockExisting = {
        id: "dec-123",
        organizationId: orgId,
        status: "EVIDENCE_REVIEW",
        deletedAt: null,
      };

      vi.mocked(prisma.decision.findFirst).mockResolvedValue(mockExisting as any);

      await expect(finalizeDecision("dec-123", orgId, userId, "Approved", "")).rejects.toThrow(
        ValidationError,
      );
    });
  });
});
