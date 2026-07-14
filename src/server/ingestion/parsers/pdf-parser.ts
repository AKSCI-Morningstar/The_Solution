import { PDFParse } from "pdf-parse";
import { AppError } from "@/shared/errors";
import type { ParseContext, ParsedDocument, Parser, FileDescriptor } from "./parser.types";

export const pdfParser: Parser = {
  name: "pdf-parser",
  version: "1.0.0",
  supportedExtensions: ["pdf"],
  supportedMimeTypes: ["application/pdf"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    // pdf-parse transfers `data` to a worker; a Node Buffer subclass isn't a
    // valid transferable, so it must be converted to a plain Uint8Array first.
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      // Sequential, not Promise.all: the underlying buffer is transferred (and
      // thus detached) to the worker on the first call, so a second concurrent
      // call sharing the same buffer fails with "Cannot transfer object of
      // unsupported type".
      const textResult = await parser.getText({ pageJoiner: "" });
      const info = await parser.getInfo();

      return {
        fullText: textResult.text,
        pages: textResult.pages.map((p) => ({ pageNumber: p.num, text: p.text })),
        sections: [],
        tables: [],
        metadata: {
          fileName: context.fileName,
          pageCount: textResult.total,
          info: info.info ?? null,
        },
      };
    } catch (error) {
      throw new AppError(
        `Failed to parse PDF document: ${error instanceof Error ? error.message : "unknown error"}`,
        "PDF_PARSE_FAILED",
        422,
      );
    } finally {
      await parser.destroy();
    }
  },
};
