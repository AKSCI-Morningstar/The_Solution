export interface ParsedSection {
  title: string;
  level: number;
  startOffset: number;
  page: number | null;
}

export interface ParsedTable {
  page: number | null;
  headers: string[];
  rows: string[][];
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  fullText: string;
  pages: ParsedPage[];
  sections: ParsedSection[];
  tables: ParsedTable[];
  metadata: Record<string, unknown>;
}

export interface ParseContext {
  fileName: string;
  mimeType: string;
  extension: string;
}

export interface FileDescriptor {
  extension: string;
  mimeType: string;
}

export interface Parser {
  readonly name: string;
  readonly version: string;
  readonly supportedExtensions: readonly string[];
  readonly supportedMimeTypes: readonly string[];
  canParse(file: FileDescriptor): boolean;
  parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument>;
}

export function emptyParsedDocument(metadata: Record<string, unknown> = {}): ParsedDocument {
  return { fullText: "", pages: [], sections: [], tables: [], metadata };
}
