import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr, type Result } from "@/shared/types/result";

describe("Result type - ok/err constructors", () => {
  it("creates success result with ok()", () => {
    const result = ok("success");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("success");
    }
  });

  it("creates error result with err()", () => {
    const error = new Error("test error");
    const result = err(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });

  it("handles ok with object data", () => {
    const data = { id: 1, name: "test" };
    const result = ok(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it("handles ok with null", () => {
    const result = ok(null);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(null);
    }
  });

  it("handles ok with undefined", () => {
    const result = ok(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("handles err with custom error classes", () => {
    class CustomError extends Error {
      code = "CUSTOM";
    }
    const error = new CustomError("custom message");
    const result = err(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("CUSTOM");
    }
  });
});

describe("Result type guards - isOk/isErr", () => {
  it("isOk returns true for success result", () => {
    const result = ok("data");
    expect(isOk(result)).toBe(true);
  });

  it("isOk returns false for error result", () => {
    const result = err(new Error("test"));
    expect(isOk(result)).toBe(false);
  });

  it("isErr returns true for error result", () => {
    const result = err(new Error("test"));
    expect(isErr(result)).toBe(true);
  });

  it("isErr returns false for success result", () => {
    const result = ok("data");
    expect(isErr(result)).toBe(false);
  });

  it("type guard narrows success result", () => {
    const result: Result<string> = ok("hello");
    if (isOk(result)) {
      const data: string = result.data;
      expect(data).toBe("hello");
    }
  });

  it("type guard narrows error result", () => {
    const result: Result<string, Error> = err(new Error("test"));
    if (isErr(result)) {
      const error: Error = result.error;
      expect(error.message).toBe("test");
    }
  });

  it("type guards work in conditional chains", () => {
    const result: Result<number> = ok(42);

    if (isOk(result)) {
      expect(result.data).toBe(42);
    } else {
      expect(result.error).toBeDefined();
    }
  });
});

describe("Result pattern - common workflows", () => {
  function parseNumber(value: unknown): Result<number> {
    if (typeof value === "number") {
      return ok(value);
    }
    return err(new Error(`Expected number, got ${typeof value}`));
  }

  it("chains results with conditional branching", () => {
    const result = parseNumber(42);

    let doubled: number | null = null;
    if (isOk(result)) {
      doubled = result.data * 2;
    }

    expect(doubled).toBe(84);
  });

  it("handles multiple result operations", () => {
    const results = [parseNumber(1), parseNumber(2), parseNumber("invalid")];

    const successCount = results.filter(isOk).length;
    const errorCount = results.filter(isErr).length;

    expect(successCount).toBe(2);
    expect(errorCount).toBe(1);
  });

  it("collects data from successful results", () => {
    const results: Result<number>[] = [ok(1), ok(2), ok(3)];
    const data = results.filter(isOk).map((r) => r.data);

    expect(data).toEqual([1, 2, 3]);
  });

  it("collects errors from failed results", () => {
    const err1 = new Error("error 1");
    const err2 = new Error("error 2");
    const results: Result<number>[] = [err(err1), err(err2)];
    const errors = results.filter(isErr).map((r) => r.error);

    expect(errors).toEqual([err1, err2]);
  });

  it("implements early return pattern", () => {
    function parseAndDouble(value: unknown): Result<number> {
      const parseResult = parseNumber(value);
      if (isErr(parseResult)) {
        return parseResult;
      }
      return ok(parseResult.data * 2);
    }

    expect(isOk(parseAndDouble(21))).toBe(true);
    if (isOk(parseAndDouble(21))) {
      expect(parseAndDouble(21).data).toBe(42);
    }

    expect(isErr(parseAndDouble("invalid"))).toBe(true);
  });
});

describe("Result type - TypeScript inference", () => {
  it("infers success type from ok()", () => {
    const result = ok({ id: 1, name: "test" });
    if (isOk(result)) {
      // TypeScript should infer type of result.data
      const id: number = result.data.id;
      const name: string = result.data.name;
      expect(id).toBe(1);
      expect(name).toBe("test");
    }
  });

  it("infers error type from err()", () => {
    class ValidationError extends Error {
      fields: string[];
      constructor(message: string, fields: string[]) {
        super(message);
        this.fields = fields;
      }
    }

    const result = err(new ValidationError("invalid", ["email", "name"]));
    if (isErr(result)) {
      // TypeScript should infer ValidationError type
      expect(result.error.fields).toContain("email");
    }
  });
});
