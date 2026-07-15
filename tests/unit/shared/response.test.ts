import { describe, expect, it } from "vitest";
import {
  createApiResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@/server/shared/response";

describe("response helpers", () => {
  it("createApiResponse wraps payload in data envelope", async () => {
    const res = createApiResponse({ id: "1" }, 201);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ data: { id: "1" } });
  });

  it("createPaginatedResponse returns flat list meta", async () => {
    const res = createPaginatedResponse({
      data: [{ id: "a" }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [{ id: "a" }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it("createErrorResponse includes code and optional details", async () => {
    const res = createErrorResponse("Validation failed", "VALIDATION_ERROR", 400, {
      action: ["Required"],
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: { action: ["Required"] },
    });
  });
});
