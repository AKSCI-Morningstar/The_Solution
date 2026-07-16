import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createRelationship,
  listRelationships,
  deleteRelationship,
  getEntityRelationships,
} from "@/server/engineering/relationship-service";
import { prisma } from "@/server/db";
import { ValidationError, NotFoundError } from "@/shared/errors";
import type { EngineeringEntity, EngineeringRelationship } from "@prisma/client";

vi.mock("@/server/db", () => {
  return {
    prisma: {
      engineeringEntity: {
        findFirst: vi.fn(),
      },
      engineeringRelationship: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      entityAuditLog: {
        create: vi.fn(),
      },
      graphEdgeIndex: {
        deleteMany: vi.fn(),
      },
    },
  };
});

describe("Relationship Service", () => {
  const orgId = "org-123";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRelationship", () => {
    it("successfully creates a relationship", async () => {
      const mockInput = {
        sourceEntityId: "source-123",
        targetEntityId: "target-123",
        relationshipType: "DEPENDS_ON" as const,
        metadata: {},
      };

      const sourceEntity = { id: "source-123", organizationId: orgId, deletedAt: null };
      const targetEntity = { id: "target-123", organizationId: orgId, deletedAt: null };

      const mockCreated = {
        id: "rel-123",
        organizationId: orgId,
        sourceEntityId: "source-123",
        targetEntityId: "target-123",
        relationshipType: "DEPENDS_ON",
        createdAt: new Date(),
        createdById: userId,
      };

      vi.mocked(prisma.engineeringEntity.findFirst)
        .mockResolvedValueOnce(sourceEntity as unknown as EngineeringEntity)
        .mockResolvedValueOnce(targetEntity as unknown as EngineeringEntity);

      vi.mocked(prisma.engineeringRelationship.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.engineeringRelationship.create).mockResolvedValue(
        mockCreated as unknown as EngineeringRelationship,
      );
      vi.mocked(prisma.entityAuditLog.create).mockResolvedValue({} as unknown as EntityAuditLog);

      const result = await createRelationship(orgId, mockInput, userId);

      expect(prisma.engineeringEntity.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.engineeringRelationship.findUnique).toHaveBeenCalled();
      expect(prisma.engineeringRelationship.create).toHaveBeenCalled();
      expect(prisma.entityAuditLog.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockCreated);
    });

    it("throws ValidationError when source and target entities are identical", async () => {
      const mockInput = {
        sourceEntityId: "same-123",
        targetEntityId: "same-123",
        relationshipType: "DEPENDS_ON" as const,
        metadata: {},
      };

      await expect(createRelationship(orgId, mockInput, userId)).rejects.toThrow(ValidationError);
      expect(prisma.engineeringEntity.findFirst).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when source entity does not exist", async () => {
      const mockInput = {
        sourceEntityId: "source-123",
        targetEntityId: "target-123",
        relationshipType: "DEPENDS_ON" as const,
        metadata: {},
      };

      vi.mocked(prisma.engineeringEntity.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "target-123" } as unknown as EngineeringEntity);

      await expect(createRelationship(orgId, mockInput, userId)).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError when relationship already exists", async () => {
      const mockInput = {
        sourceEntityId: "source-123",
        targetEntityId: "target-123",
        relationshipType: "DEPENDS_ON" as const,
        metadata: {},
      };

      const sourceEntity = { id: "source-123", organizationId: orgId, deletedAt: null };
      const targetEntity = { id: "target-123", organizationId: orgId, deletedAt: null };
      const existing = { id: "existing-rel" };

      vi.mocked(prisma.engineeringEntity.findFirst)
        .mockResolvedValueOnce(sourceEntity as unknown as EngineeringEntity)
        .mockResolvedValueOnce(targetEntity as unknown as EngineeringEntity);

      vi.mocked(prisma.engineeringRelationship.findUnique).mockResolvedValue(
        existing as unknown as EngineeringRelationship,
      );

      await expect(createRelationship(orgId, mockInput, userId)).rejects.toThrow(ValidationError);
      expect(prisma.engineeringRelationship.create).not.toHaveBeenCalled();
    });
  });

  describe("listRelationships", () => {
    it("returns paginated relationships list", async () => {
      const mockRelationships = [
        { id: "1", relationshipType: "DEPENDS_ON" },
        { id: "2", relationshipType: "REFERENCES" },
      ];

      vi.mocked(prisma.engineeringRelationship.findMany).mockResolvedValue(
        mockRelationships as unknown as EngineeringRelationship[],
      );
      vi.mocked(prisma.engineeringRelationship.count).mockResolvedValue(5);

      const result = await listRelationships(orgId, { page: "1", pageSize: "2" });

      expect(result.data).toEqual(mockRelationships);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
    });
  });

  describe("deleteRelationship", () => {
    it("successfully deletes the relationship and cleans up graph edge index", async () => {
      const existing = {
        id: "rel-123",
        sourceEntityId: "source-123",
        targetEntityId: "target-123",
        relationshipType: "DEPENDS_ON",
        organizationId: orgId,
      };

      vi.mocked(prisma.engineeringRelationship.findFirst).mockResolvedValue(
        existing as unknown as EngineeringRelationship,
      );

      await deleteRelationship("rel-123", orgId, userId);

      expect(prisma.engineeringRelationship.delete).toHaveBeenCalledWith({
        where: { id: "rel-123" },
      });
      expect(prisma.graphEdgeIndex.deleteMany).toHaveBeenCalledWith({
        where: { relationshipId: "rel-123" },
      });
      expect(prisma.entityAuditLog.create).toHaveBeenCalledTimes(2);
    });

    it("throws NotFoundError if relationship does not exist", async () => {
      vi.mocked(prisma.engineeringRelationship.findFirst).mockResolvedValue(null);

      await expect(deleteRelationship("rel-123", orgId, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getEntityRelationships", () => {
    it("returns incoming and outgoing relationships for an entity", async () => {
      const entity = { id: "entity-123", organizationId: orgId, deletedAt: null };
      const incoming = [{ id: "rel-in", sourceEntityId: "source-1" }];
      const outgoing = [{ id: "rel-out", targetEntityId: "target-2" }];

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        entity as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.engineeringRelationship.findMany)
        .mockResolvedValueOnce(incoming as unknown as EngineeringRelationship[])
        .mockResolvedValueOnce(outgoing as unknown as EngineeringRelationship[]);

      const result = await getEntityRelationships("entity-123", orgId);

      expect(result.incoming).toEqual(incoming);
      expect(result.outgoing).toEqual(outgoing);
    });

    it("throws NotFoundError if target entity does not exist", async () => {
      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(null);

      await expect(getEntityRelationships("entity-123", orgId)).rejects.toThrow(NotFoundError);
    });
  });
});
