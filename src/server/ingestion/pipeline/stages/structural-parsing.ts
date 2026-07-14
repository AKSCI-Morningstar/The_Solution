import { parserRegistry, type ParsedDocument } from "../../parsers";

export interface StructuralParsingInput {
  buffer: Buffer;
  extension: string;
  mimeType: string;
  fileName: string;
}

export interface StructuralParsingOutput {
  document: ParsedDocument;
  parserName: string;
  parserVersion: string;
}

export async function runStructuralParsing(
  input: StructuralParsingInput,
): Promise<StructuralParsingOutput> {
  return parserRegistry.parseWithFallback(
    input.buffer,
    { extension: input.extension, mimeType: input.mimeType },
    { fileName: input.fileName, mimeType: input.mimeType, extension: input.extension },
  );
}
