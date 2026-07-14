import mammoth from "mammoth";
import { AppError } from "@/shared/errors";
import type { ParseContext, ParsedDocument, Parser, FileDescriptor } from "./parser.types";

export const docxParser: Parser = {
  name: "docx-parser",
  version: "1.0.0",
  supportedExtensions: ["docx"],
  supportedMimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    let result;
    try {
      result = await mammoth.extractRawText({ buffer });
    } catch (error) {
      throw new AppError(
        `Failed to parse DOCX document: ${error instanceof Error ? error.message : "unknown error"}`,
        "DOCX_PARSE_FAILED",
        422,
      );
    }

    const fullText = result.value;
    return {
      fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      sections: [],
      tables: [],
      metadata: {
        fileName: context.fileName,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        conversionWarnings: result.messages.length,
      },
    };
  },
};
