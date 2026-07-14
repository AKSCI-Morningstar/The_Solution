import { describe, expect, it } from "vitest";
import { parserRegistry } from "@/server/ingestion/parsers/parser-registry";

describe("parserRegistry.resolve", () => {
  it("resolves the txt parser for a .txt file", () => {
    const parser = parserRegistry.resolve({ extension: "txt", mimeType: "text/plain" });
    expect(parser?.name).toBe("txt-parser");
  });

  it("resolves the csv parser for a .csv file", () => {
    const parser = parserRegistry.resolve({ extension: "csv", mimeType: "text/csv" });
    expect(parser?.name).toBe("csv-parser");
  });

  it("returns null for an unregistered extension", () => {
    const parser = parserRegistry.resolve({
      extension: "xyz",
      mimeType: "application/octet-stream",
    });
    expect(parser).toBeNull();
  });

  it("never resolves the generic fallback parser directly", () => {
    const parser = parserRegistry.resolve({ extension: "txt", mimeType: "text/plain" });
    expect(parser?.name).not.toBe("generic-text-fallback-parser");
  });
});

describe("parserRegistry.parseWithFallback", () => {
  it("parses a normal text file with the txt parser and records success", async () => {
    const buffer = Buffer.from("REQ-1001 shall pass.");
    const result = await parserRegistry.parseWithFallback(
      buffer,
      { extension: "txt", mimeType: "text/plain" },
      { fileName: "sample.txt", mimeType: "text/plain", extension: "txt" },
    );

    expect(result.parserName).toBe("txt-parser");
    expect(result.document.fullText).toContain("REQ-1001");

    const health = parserRegistry.listHealth().find((h) => h.parserName === "txt-parser");
    expect(health?.totalRuns).toBeGreaterThan(0);
    expect(health?.lastSuccessAt).not.toBeNull();
  });

  it("throws for an unregistered extension instead of silently falling back", async () => {
    await expect(
      parserRegistry.parseWithFallback(
        Buffer.from("data"),
        { extension: "xyz", mimeType: "application/octet-stream" },
        { fileName: "sample.xyz", mimeType: "application/octet-stream", extension: "xyz" },
      ),
    ).rejects.toThrow(/No parser registered/);
  });
});
