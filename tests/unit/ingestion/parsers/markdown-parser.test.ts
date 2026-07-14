import { describe, expect, it } from "vitest";
import {
  markdownParser,
  extractMarkdownSections,
} from "@/server/ingestion/parsers/markdown-parser";

describe("extractMarkdownSections", () => {
  it("extracts headings with their level", () => {
    const text =
      "# Title\n\nIntro text.\n\n## Requirements\n\nREQ-1001 shall pass.\n\n### Sub detail\n";
    const sections = extractMarkdownSections(text);

    expect(sections.map((s) => [s.title, s.level])).toEqual([
      ["Title", 1],
      ["Requirements", 2],
      ["Sub detail", 3],
    ]);
  });

  it("returns no sections for text with no headings", () => {
    expect(extractMarkdownSections("just a paragraph\nwith no headings")).toEqual([]);
  });
});

describe("markdownParser", () => {
  it("parses markdown into fullText plus extracted sections", async () => {
    const buffer = Buffer.from("# Spec\n\nSPEC-A100 applies.\n");
    const result = await markdownParser.parse(buffer, {
      fileName: "sample.md",
      mimeType: "text/markdown",
      extension: "md",
    });

    expect(result.fullText).toContain("SPEC-A100");
    expect(result.sections).toEqual([{ title: "Spec", level: 1, startOffset: 0, page: null }]);
  });
});
