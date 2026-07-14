import type { ParseContext, ParsedDocument, Parser } from "./parser.types";

/**
 * Used only as an explicit fallback by the parser registry when a specialized
 * text-representable parser fails - never auto-selected by extension/mimetype
 * (canParse always returns false so normal resolution skips it).
 */
export const genericTextFallbackParser: Parser = {
  name: "generic-text-fallback-parser",
  version: "1.0.0",
  supportedExtensions: [],
  supportedMimeTypes: [],

  canParse(): boolean {
    return false;
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    const fullText = buffer.toString("utf-8");
    return {
      fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      sections: [],
      tables: [],
      metadata: { fileName: context.fileName, fallback: true },
    };
  },
};
