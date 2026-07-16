import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  changeEntityStatus,
} from "@/server/engineering/entity-service";
import { prisma } from "@/server/db";
import { ValidationError, NotFoundError } from "@/shared/errors";
import type { EngineeringEntity, EntityAuditLog, GraphNodeIndex } from "@prisma/client";

vi.mock("@/server/db", () => {
  return {
    prisma: {
      engineeringEntity: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      entityAuditLog: {
        create: vi.fn(),
      },
      graphNodeIndex: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      graphEdgeIndex: {
        deleteMany: vi.fn(),
      },
    },
  };
});

describe("Entity Service", () => {
  const orgId = "org-123";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEntity", () => {
    it("successfully creates a new entity", async () => {
      const mockInput = {
        entityType: "COMPONENT" as const,
        identifier: "PART-123",
        name: "Test Part",
        description: "A test component",
        status: "DRAFT" as const,
      };

      const mockCreated = {
        id: "entity-123",
        organizationId: orgId,
        ...mockInput,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.engineeringEntity.create).mockResolvedValue(
        mockCreated as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.entityAuditLog.create).mockResolvedValue({} as unknown as EntityAuditLog);

      const result = await createEntity(orgId, mockInput, userId);

      expect(prisma.engineeringEntity.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_identifier: {
            organizationId: orgId,
            identifier: mockInput.identifier,
          },
        },
      });
      expect(prisma.engineeringEntity.create).toHaveBeenCalled();
      expect(prisma.entityAuditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("throws ValidationError if identifier already exists and is not deleted", async () => {
      const mockInput = {
        entityType: "COMPONENT" as const,
        identifier: "PART-123",
        name: "Test Part",
      };

      const existingEntity = {
        id: "existing-123",
        organizationId: orgId,
        identifier: "PART-123",
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findUnique).mockResolvedValue(
        existingEntity as unknown as EngineeringEntity,
      );

      await expect(createEntity(orgId, mockInput, userId)).rejects.toThrow(ValidationError);
      expect(prisma.engineeringEntity.create).not.toHaveBeenCalled();
    });

    it("allows creation if existing identifier is soft-deleted", async () => {
      const mockInput = {
        entityType: "COMPONENT" as const,
        identifier: "PART-123",
        name: "Test Part",
      };

      const deletedEntity = {
        id: "existing-123",
        organizationId: orgId,
        identifier: "PART-123",
        deletedAt: new Date(),
      };

      const mockCreated = {
        id: "entity-123",
        organizationId: orgId,
        ...mockInput,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findUnique).mockResolvedValue(
        deletedEntity as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.engineeringEntity.create).mockResolvedValue(
        mockCreated as unknown as EngineeringEntity,
      );

      const result = await createEntity(orgId, mockInput, userId);
      expect(result).toEqual(mockCreated);
    });
  });

  describe("getEntity", () => {
    it("returns entity when found", async () => {
      const mockEntity = {
        id: "entity-123",
        organizationId: orgId,
        identifier: "PART-123",
        name: "Test Component",
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        mockEntity as unknown as EngineeringEntity,
      );

      const result = await getEntity("entity-123", orgId);

      expect(prisma.engineeringEntity.findFirst).toHaveBeenCalledWith({
        where: { id: "entity-123", organizationId: orgId, deletedAt: null },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockEntity);
    });

    it("throws NotFoundError when entity not found", async () => {
      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(null);

      await expect(getEntity("entity-123", orgId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("listEntities", () => {
    it("returns paginated data", async () => {
      const mockEntities = [
        { id: "1", name: "A", identifier: "A1" },
        { id: "2", name: "B", identifier: "B1" },
      ];

      vi.mocked(prisma.engineeringEntity.findMany).mockResolvedValue(
        mockEntities as unknown as EngineeringEntity[],
      );
      vi.mocked(prisma.engineeringEntity.count).mockResolvedValue(10);

      const result = await listEntities(orgId, { page: "1", pageSize: "2" });

      expect(result.data).toEqual(mockEntities);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(5);
    });

    it("throws ValidationError for invalid filter inputs", async () => {
      await expect(listEntities(orgId, { page: "-1" })).rejects.toThrow(ValidationError);
    });
  });

  describe("updateEntity", () => {
    it("updates entity successfully", async () => {
      const existing = {
        id: "entity-123",
        organizationId: orgId,
        name: "Old Name",
        deletedAt: null,
      };

      const updated = {
        ...existing,
        name: "New Name",
      };

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        existing as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.engineeringEntity.update).mockResolvedValue(
        updated as unknown as EngineeringEntity,
      );

      const result = await updateEntity("entity-123", orgId, { name: "New Name" }, userId);

      expect(result.name).toBe("New Name");
      expect(prisma.engineeringEntity.update).toHaveBeenCalled();
      expect(prisma.entityAuditLog.create).toHaveBeenCalled();
    });

    it("throws NotFoundError if entity to update does not exist", async () => {
      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(null);

      await expect(updateEntity("entity-123", orgId, { name: "New Name" }, userId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("deleteEntity", () => {
    it("soft deletes the entity and cleans up graph indexes", async () => {
      const existing = {
        id: "entity-123",
        organizationId: orgId,
        entityType: "COMPONENT",
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        existing as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.graphNodeIndex.findUnique).mockResolvedValue({
        id: "node-123",
        entityId: "entity-123",
      } as unknown as GraphNodeIndex);

      await deleteEntity("entity-123", orgId, userId);

      expect(prisma.engineeringEntity.update).toHaveBeenCalledWith({
        where: { id: "entity-123" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: userId,
        }),
      });
      expect(prisma.graphEdgeIndex.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ sourceNodeId: "node-123" }, { targetNodeId: "node-123" }] },
      });
      expect(prisma.graphNodeIndex.delete).toHaveBeenCalledWith({
        where: { id: "node-123" },
      });
      expect(prisma.entityAuditLog.create).toHaveBeenCalled();
    });

    it("throws NotFoundError if entity to delete does not exist", async () => {
      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(null);

      await expect(deleteEntity("entity-123", orgId, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("changeEntityStatus", () => {
    it("successfully changes status for allowed transition", async () => {
      const existing = {
        id: "entity-123",
        organizationId: orgId,
        status: "DRAFT",
        deletedAt: null,
      };

      const updated = {
        ...existing,
        status: "ACTIVE",
      };

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        existing as unknown as EngineeringEntity,
      );
      vi.mocked(prisma.engineeringEntity.update).mockResolvedValue(
        updated as unknown as EngineeringEntity,
      );

      const result = await changeEntityStatus("entity-123", orgId, "ACTIVE", userId);

      expect(result.status).toBe("ACTIVE");
      expect(prisma.engineeringEntity.update).toHaveBeenCalledWith({
        where: { id: "entity-123" },
        data: { status: "ACTIVE", updatedById: userId },
      });
      expect(prisma.entityAuditLog.create).toHaveBeenCalled();
    });

    it("throws ValidationError for disallowed transition", async () => {
      const existing = {
        id: "entity-123",
        organizationId: orgId,
        status: "DRAFT",
        deletedAt: null,
      };

      vi.mocked(prisma.engineeringEntity.findFirst).mockResolvedValue(
        existing as unknown as EngineeringEntity,
      );

      // Transition from DRAFT to APPROVED is not allowed in constants (DRAFT -> ACTIVE or ARCHIVED)
      await expect(changeEntityStatus("entity-123", orgId, "APPROVED", userId)).rejects.toThrow(
        ValidationError,
      );
      expect(prisma.engineeringEntity.update).not.toHaveBeenCalled();
    });
  });
});
