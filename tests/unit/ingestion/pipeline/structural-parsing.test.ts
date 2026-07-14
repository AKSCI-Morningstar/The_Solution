import { describe, expect, it } from "vitest";
import { runStructuralParsing } from "@/server/ingestion/pipeline/stages/structural-parsing";

describe("runStructuralParsing", () => {
  it("resolves and invokes the correct parser for the given extension", async () => {
    const buffer = Buffer.from("REQ-1001 shall pass.");
    const result = await runStructuralParsing({
      buffer,
      extension: "txt",
      mimeType: "text/plain",
      fileName: "sample.txt",
    });

    expect(result.parserName).toBe("txt-parser");
    expect(result.document.fullText).toContain("REQ-1001");
  });
});
