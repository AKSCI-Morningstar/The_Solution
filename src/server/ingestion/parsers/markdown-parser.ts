import type {
  ParseContext,
  ParsedDocument,
  ParsedSection,
  Parser,
  FileDescriptor,
} from "./parser.types";

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;

export function extractMarkdownSections(fullText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let offset = 0;
  for (const line of fullText.split("\n")) {
    const match = HEADING_PATTERN.exec(line.trim());
    if (match) {
      sections.push({
        title: match[2].trim(),
        level: match[1].length,
        startOffset: offset,
        page: null,
      });
    }
    offset += line.length + 1;
  }
  return sections;
}

export const markdownParser: Parser = {
  name: "markdown-parser",
  version: "1.0.0",
  supportedExtensions: ["md", "markdown"],
  supportedMimeTypes: ["text/markdown"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    const fullText = buffer.toString("utf-8");
    return {
      fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      sections: extractMarkdownSections(fullText),
      tables: [],
      metadata: {
        fileName: context.fileName,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
      },
    };
  },
};
