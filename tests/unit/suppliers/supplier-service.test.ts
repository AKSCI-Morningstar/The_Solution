import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import { createSupplier, getSupplier, listSuppliers } from "@/server/suppliers/supplier-service";
import type { Supplier } from "@prisma/client";

vi.mock("@/server/db", () => ({
  prisma: {
    supplier: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/audit/audit-service", () => ({
  recordAuditEvent: vi.fn(),
}));

describe("Supplier Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSupplier", () => {
    it("should successfully create a new supplier", async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);
      const mockSupplier = {
        id: "sup-123",
        identifier: "V-12345",
        name: "Test Supplier",
        supplierType: "MANUFACTURER",
      };
      vi.mocked(prisma.supplier.create).mockResolvedValue(mockSupplier as unknown as Supplier);

      const input = {
        identifier: "V-12345",
        name: "Test Supplier",
        supplierType: "MANUFACTURER",
        status: "ACTIVE",
      };

      const result = await createSupplier("org-1", input, "user-1");

      expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_identifier: {
            organizationId: "org-1",
            identifier: "V-12345",
          },
        },
      });

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          identifier: "V-12345",
          name: "Test Supplier",
          supplierType: "MANUFACTURER",
          createdById: "user-1",
        }),
      });

      expect(result).toEqual(mockSupplier);
    });

    it("should throw if supplier with identifier already exists", async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue({
        id: "sup-1",
      } as unknown as Supplier);

      await expect(
        createSupplier(
          "org-1",
          {
            identifier: "V-12345",
            name: "Test Supplier",
            supplierType: "SUPPLIER",
            status: "ACTIVE",
          },
          "user-1",
        ),
      ).rejects.toThrow(/already exists/);
    });
  });

  describe("getSupplier", () => {
    it("should return the supplier if found", async () => {
      const mockSupplier = {
        id: "sup-123",
        identifier: "V-12345",
        name: "Test Supplier",
      };
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue(mockSupplier as unknown as Supplier);

      const result = await getSupplier("sup-123", "org-1");

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sup-123", organizationId: "org-1", deletedAt: null },
        }),
      );
      expect(result).toEqual(mockSupplier);
    });

    it("should throw NotFoundError if not found", async () => {
      vi.mocked(prisma.supplier.findFirst).mockResolvedValue(null);

      await expect(getSupplier("sup-123", "org-1")).rejects.toThrow(/not found/);
    });
  });

  describe("listSuppliers", () => {
    it("should return paginated list of suppliers", async () => {
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([
        { id: "sup-1", name: "Sup 1" },
      ] as unknown as Supplier[]);
      vi.mocked(prisma.supplier.count).mockResolvedValue(1);

      const result = await listSuppliers("org-1", { page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});
