import { describe, expect, it } from "vitest";
import { auditFilterSchema } from "@/server/audit/validation";
import { searchQuerySchema } from "@/shared/validation/schemas";

describe("auditFilterSchema", () => {
  it("applies pagination defaults", () => {
    const parsed = auditFilterSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.pageSize).toBe(20);
    }
  });

  it("accepts filter fields and coerces dates", () => {
    const parsed = auditFilterSchema.safeParse({
      page: "2",
      pageSize: "10",
      action: "rule.published",
      entity: "Rule",
      entityId: "abc",
      search: "publish",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-12-31T23:59:59.000Z",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.pageSize).toBe(10);
      expect(parsed.data.action).toBe("rule.published");
      expect(parsed.data.from).toBeInstanceOf(Date);
      expect(parsed.data.to).toBeInstanceOf(Date);
    }
  });

  it("rejects oversized pageSize", () => {
    const parsed = auditFilterSchema.safeParse({ pageSize: "500" });
    expect(parsed.success).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("defaults empty query and limit", () => {
    const parsed = searchQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.q).toBe("");
      expect(parsed.data.limit).toBe(10);
      expect(parsed.data.type).toBeUndefined();
    }
  });

  it("accepts typed search filters", () => {
    const parsed = searchQuerySchema.safeParse({
      q: "  coupling  ",
      limit: "25",
      type: "entity",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.q).toBe("coupling");
      expect(parsed.data.limit).toBe(25);
      expect(parsed.data.type).toBe("entity");
    }
  });

  it("rejects invalid type values", () => {
    const parsed = searchQuerySchema.safeParse({ q: "x", type: "widget" });
    expect(parsed.success).toBe(false);
  });
});
