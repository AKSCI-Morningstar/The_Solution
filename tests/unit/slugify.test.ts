import { describe, it, expect } from "vitest";
import { slugify } from "@/server/organizations/slug";

describe("slugify", () => {
  it("converts to lowercase", async () => {
    expect(await slugify("ACME Corp")).toBe("acme-corp");
  });

  it("replaces spaces with hyphens", async () => {
    expect(await slugify("my organization")).toBe("my-organization");
  });

  it("removes special characters", async () => {
    expect(await slugify("Hello! World?")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", async () => {
    expect(await slugify("--org--")).toBe("org");
  });

  it("handles empty input", async () => {
    expect(await slugify("")).toBe("org");
  });

  it("handles multiple consecutive spaces", async () => {
    expect(await slugify("big   spacing")).toBe("big-spacing");
  });
});
