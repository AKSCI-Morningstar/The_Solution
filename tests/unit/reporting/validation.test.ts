import { describe, expect, it } from "vitest";
import {
  analyticsFilterSchema,
  exportFormatSchema,
  generateReportSchema,
  reportListFilterSchema,
} from "@/server/reporting/validation";

describe("generateReportSchema", () => {
  it("accepts a valid report type with no filters", () => {
    const parsed = generateReportSchema.safeParse({ type: "EXECUTIVE" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.filters).toEqual({});
  });

  it("rejects an unknown report type", () => {
    const parsed = generateReportSchema.safeParse({ type: "NOT_A_REAL_TYPE" });
    expect(parsed.success).toBe(false);
  });

  it("accepts optional filters and title", () => {
    const parsed = generateReportSchema.safeParse({
      type: "CONTRADICTION",
      title: "Q3 Contradictions",
      filters: { entityType: "COMPONENT", search: "engine" },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("reportListFilterSchema", () => {
  it("defaults sortBy to createdAt and sortOrder to desc", () => {
    const parsed = reportListFilterSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sortBy).toBe("createdAt");
      expect(parsed.data.sortOrder).toBe("desc");
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.pageSize).toBe(20);
    }
  });

  it("rejects an invalid sortBy value", () => {
    const parsed = reportListFilterSchema.safeParse({ sortBy: "notAField" });
    expect(parsed.success).toBe(false);
  });

  it("coerces isFavorite from a query string", () => {
    const parsed = reportListFilterSchema.safeParse({ isFavorite: "true" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.isFavorite).toBe(true);
  });
});

describe("analyticsFilterSchema", () => {
  it("defaults trendWindowDays to 30", () => {
    const parsed = analyticsFilterSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.trendWindowDays).toBe(30);
  });

  it("rejects a window below 7 days", () => {
    const parsed = analyticsFilterSchema.safeParse({ trendWindowDays: 3 });
    expect(parsed.success).toBe(false);
  });

  it("rejects a window above 365 days", () => {
    const parsed = analyticsFilterSchema.safeParse({ trendWindowDays: 400 });
    expect(parsed.success).toBe(false);
  });
});

describe("exportFormatSchema", () => {
  it("defaults format to JSON", () => {
    const parsed = exportFormatSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.format).toBe("JSON");
  });

  it("accepts CSV, EXCEL, and PDF", () => {
    for (const format of ["CSV", "EXCEL", "PDF"]) {
      expect(exportFormatSchema.safeParse({ format }).success).toBe(true);
    }
  });

  it("rejects an unknown format", () => {
    expect(exportFormatSchema.safeParse({ format: "XML" }).success).toBe(false);
  });
});
