import { detectFormat } from "../file-signature";
import {
  emptyParsedDocument,
  type ParseContext,
  type ParsedDocument,
  type Parser,
  type FileDescriptor,
} from "./parser.types";

/**
 * Images are ingested for metadata only (per the ingestion pipeline's scope) -
 * no OCR/content extraction, no pixel dimensions. Sections/tables/entities are
 * never produced for images; downstream stages simply see an empty document.
 */
export const imageParser: Parser = {
  name: "image-parser",
  version: "1.0.0",
  supportedExtensions: ["png", "jpg", "jpeg", "gif"],
  supportedMimeTypes: ["image/png", "image/jpeg", "image/gif"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    return emptyParsedDocument({
      fileName: context.fileName,
      detectedFormat: detectFormat(buffer),
      sizeBytes: buffer.length,
      contentExtracted: false,
    });
  },
};
