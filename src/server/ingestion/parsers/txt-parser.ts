import type { ParseContext, ParsedDocument, Parser, FileDescriptor } from "./parser.types";

export const txtParser: Parser = {
  name: "txt-parser",
  version: "1.0.0",
  supportedExtensions: ["txt"],
  supportedMimeTypes: ["text/plain"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    const fullText = buffer.toString("utf-8");
    return {
      fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      sections: [],
      tables: [],
      metadata: {
        fileName: context.fileName,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
      },
    };
  },
};
