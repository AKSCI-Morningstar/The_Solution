import { describe, expect, it } from "vitest";
import { extractMetadata } from "@/server/ingestion/pipeline/stages/metadata-extraction";
import type { ParsedDocument } from "@/server/ingestion/parsers";

describe("extractMetadata", () => {
  it("combines file and parsed-document metadata", () => {
    const parsedDocument: ParsedDocument = {
      fullText: "one two three",
      pages: [{ pageNumber: 1, text: "one two three" }],
      sections: [{ title: "Intro", level: 1, startOffset: 0, page: null }],
      tables: [],
      metadata: { customField: "value" },
    };

    const metadata = extractMetadata({
      fileName: "sample.txt",
      sizeBytes: 123,
      checksum: "abc123",
      parsedDocument,
    });

    expect(metadata.fileName).toBe("sample.txt");
    expect(metadata.sizeBytes).toBe(123);
    expect(metadata.checksum).toBe("abc123");
    expect(metadata.pageCount).toBe(1);
    expect(metadata.wordCount).toBe(3);
    expect(metadata.sectionCount).toBe(1);
    expect(metadata.tableCount).toBe(0);
    expect(metadata.customField).toBe("value");
  });
});
