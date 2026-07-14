import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pdfParser } from "@/server/ingestion/parsers/pdf-parser";

const FIXTURE_PATH = path.join(process.cwd(), "tests/fixtures/ingestion/sample.pdf");

describe("pdfParser", () => {
  it("extracts per-page text from a real PDF file", async () => {
    const buffer = readFileSync(FIXTURE_PATH);
    const result = await pdfParser.parse(buffer, {
      fileName: "sample.pdf",
      mimeType: "application/pdf",
      extension: "pdf",
    });

    expect(result.fullText).toContain("REQ-2002");
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.metadata.pageCount).toBe(1);
  });

  it("throws a descriptive AppError for a corrupt file", async () => {
    const buffer = Buffer.from("not a real pdf file");
    await expect(
      pdfParser.parse(buffer, { fileName: "bad.pdf", mimeType: "", extension: "pdf" }),
    ).rejects.toThrow(/Failed to parse PDF/);
  });
});
