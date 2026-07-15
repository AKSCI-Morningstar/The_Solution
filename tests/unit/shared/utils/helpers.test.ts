import { describe, it, expect } from "vitest";
import { cn, formatDate, pluralize, truncate, capitalize } from "@/shared/utils";

describe("cn (className merger)", () => {
  it("merges multiple class strings", () => {
    const result = cn("px-4 py-2", "bg-blue-500");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("bg-blue-500");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toContain("base-class");
    expect(result).toContain("active-class");
  });

  it("filters out falsy values", () => {
    const result = cn("class-1", false && "class-2", null, undefined, "class-3");
    expect(result).toContain("class-1");
    expect(result).toContain("class-3");
    expect(result).not.toContain("class-2");
  });

  it("handles array inputs", () => {
    const result = cn(["px-4", "py-2"], "bg-blue-500");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("bg-blue-500");
  });

  it("handles object inputs", () => {
    const result = cn({
      "px-4": true,
      "py-2": false,
      "bg-blue-500": true,
    });
    expect(result).toContain("px-4");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("py-2");
  });
});

describe("formatDate", () => {
  it("converts Date to ISO string", () => {
    const date = new Date("2026-07-15T10:30:00Z");
    const result = formatDate(date);
    expect(result).toBe("2026-07-15T10:30:00.000Z");
  });

  it("handles epoch date", () => {
    const date = new Date(0);
    const result = formatDate(date);
    expect(result).toBe("1970-01-01T00:00:00.000Z");
  });

  it("is reversible", () => {
    const original = new Date("2026-07-15T10:30:00Z");
    const formatted = formatDate(original);
    const reparsed = new Date(formatted);
    expect(reparsed.getTime()).toBe(original.getTime());
  });

  it("handles negative dates (before epoch)", () => {
    const date = new Date("1969-12-31T23:59:59Z");
    const result = formatDate(date);
    expect(result).toBe("1969-12-31T23:59:59.000Z");
  });
});

describe("pluralize", () => {
  it("returns singular when count is 1", () => {
    expect(pluralize(1, "item")).toBe("item");
  });

  it("returns plural when count is 0", () => {
    expect(pluralize(0, "item")).toBe("items");
  });

  it("returns plural when count > 1", () => {
    expect(pluralize(5, "item")).toBe("items");
  });

  it("uses custom plural form when provided", () => {
    expect(pluralize(2, "person", "people")).toBe("people");
  });

  it("uses default 's' suffix when custom plural not provided", () => {
    expect(pluralize(2, "cat")).toBe("cats");
  });

  it("handles negative counts", () => {
    expect(pluralize(-1, "item")).toBe("items");
  });

  it("handles irregular plurals with custom form", () => {
    expect(pluralize(3, "child", "children")).toBe("children");
  });

  it("respects count of exactly 1 with negative numbers", () => {
    // Only count === 1 returns singular
    expect(pluralize(1, "item")).toBe("item");
    expect(pluralize(-1, "item")).toBe("items");
  });
});

describe("truncate", () => {
  it("returns unchanged string when within limit", () => {
    const result = truncate("hello", 10);
    expect(result).toBe("hello");
  });

  it("returns unchanged string when exactly at limit", () => {
    const result = truncate("hello", 5);
    expect(result).toBe("hello");
  });

  it("truncates and adds ellipsis when exceeding limit", () => {
    const result = truncate("hello world", 5);
    expect(result).toBe("hello...");
  });

  it("handles empty string", () => {
    const result = truncate("", 5);
    expect(result).toBe("");
  });

  it("handles single character limit", () => {
    const result = truncate("hello", 1);
    expect(result).toBe("h...");
  });

  it("handles very long strings", () => {
    const longString = "a".repeat(1000);
    const result = truncate(longString, 10);
    expect(result).toBe("a".repeat(10) + "...");
  });

  it("handles unicode characters correctly", () => {
    const result = truncate("こんにちは世界", 3);
    expect(result).toBe("こんに...");
  });
});

describe("capitalize", () => {
  it("capitalizes first character", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("preserves rest of string", () => {
    expect(capitalize("hELLO")).toBe("HELLO");
  });

  it("handles already capitalized strings", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles strings with numbers", () => {
    expect(capitalize("123abc")).toBe("123abc");
  });

  it("handles special characters at start", () => {
    expect(capitalize("_hello")).toBe("_hello");
  });

  it("handles unicode characters", () => {
    expect(capitalize("école")).toBe("École");
  });
});
