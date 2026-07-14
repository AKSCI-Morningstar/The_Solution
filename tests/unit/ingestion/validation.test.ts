import { describe, expect, it } from "vitest";
import {
  documentFilterSchema,
  jobFilterSchema,
  startJobSchema,
} from "@/server/ingestion/validation";

describe("startJobSchema", () => {
  it("accepts a minimal valid payload with defaults", () => {
    const result = startJobSchema.safeParse({ documentId: "doc_1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(0);
    }
  });

  it("rejects a missing documentId", () => {
    expect(startJobSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an out-of-range priority", () => {
    expect(startJobSchema.safeParse({ documentId: "doc_1", priority: 999 }).success).toBe(false);
  });
});

describe("jobFilterSchema", () => {
  it("accepts a valid status filter", () => {
    const result = jobFilterSchema.safeParse({ status: "RUNNING", page: "2", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it("rejects an invalid status value", () => {
    expect(jobFilterSchema.safeParse({ status: "NOT_A_STATUS" }).success).toBe(false);
  });
});

describe("documentFilterSchema", () => {
  it("defaults page/pageSize when omitted", () => {
    const result = documentFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });
});
