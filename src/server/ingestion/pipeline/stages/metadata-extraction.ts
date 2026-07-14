import type { ParsedDocument } from "../../parsers";

export interface MetadataExtractionInput {
  fileName: string;
  sizeBytes: number;
  checksum: string;
  parsedDocument: ParsedDocument;
}

export function extractMetadata(input: MetadataExtractionInput): Record<string, unknown> {
  const wordCount = input.parsedDocument.fullText.split(/\s+/).filter(Boolean).length;

  return {
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    checksum: input.checksum,
    pageCount: input.parsedDocument.pages.length,
    wordCount,
    sectionCount: input.parsedDocument.sections.length,
    tableCount: input.parsedDocument.tables.length,
    ...input.parsedDocument.metadata,
  };
}
