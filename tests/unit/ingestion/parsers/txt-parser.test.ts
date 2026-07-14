import { describe, expect, it } from "vitest";
import { txtParser } from "@/server/ingestion/parsers/txt-parser";

describe("txtParser", () => {
  it("reports support only for .txt", () => {
    expect(txtParser.canParse({ extension: "txt", mimeType: "text/plain" })).toBe(true);
    expect(txtParser.canParse({ extension: "csv", mimeType: "text/csv" })).toBe(false);
  });

  it("parses plain text into a single page with no sections or tables", async () => {
    const buffer = Buffer.from("Requirement REQ-1001: the bracket shall withstand load.");
    const result = await txtParser.parse(buffer, {
      fileName: "sample.txt",
      mimeType: "text/plain",
      extension: "txt",
    });

    expect(result.fullText).toContain("REQ-1001");
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.sections).toEqual([]);
    expect(result.tables).toEqual([]);
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });
});
