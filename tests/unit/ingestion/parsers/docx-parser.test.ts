import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docxParser } from "@/server/ingestion/parsers/docx-parser";

const FIXTURE_PATH = path.join(process.cwd(), "tests/fixtures/ingestion/sample.docx");

describe("docxParser", () => {
  it("extracts raw text from a real .docx file", async () => {
    const buffer = readFileSync(FIXTURE_PATH);
    const result = await docxParser.parse(buffer, {
      fileName: "sample.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
    });

    expect(result.fullText).toContain("REQ-1001");
    expect(result.fullText).toContain("titanium");
    expect(result.pages).toHaveLength(1);
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });

  it("throws a descriptive AppError for a corrupt file", async () => {
    const buffer = Buffer.from("not a real docx file");
    await expect(
      docxParser.parse(buffer, { fileName: "bad.docx", mimeType: "", extension: "docx" }),
    ).rejects.toThrow(/Failed to parse DOCX/);
  });
});
