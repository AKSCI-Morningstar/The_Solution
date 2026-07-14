import type { ParseContext, ParsedDocument, Parser, FileDescriptor } from "./parser.types";

/** Parses one CSV record respecting double-quoted fields (with "" escaping and embedded commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export const csvParser: Parser = {
  name: "csv-parser",
  version: "1.0.0",
  supportedExtensions: ["csv"],
  supportedMimeTypes: ["text/csv"],

  canParse(file: FileDescriptor): boolean {
    return this.supportedExtensions.includes(file.extension.toLowerCase());
  },

  async parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument> {
    const fullText = buffer.toString("utf-8");
    const rows = parseCsv(fullText);
    const [headers, ...dataRows] = rows;

    return {
      fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      sections: [],
      tables: headers && headers.length > 0 ? [{ page: null, headers, rows: dataRows }] : [],
      metadata: {
        fileName: context.fileName,
        rowCount: dataRows.length,
        columnCount: headers?.length ?? 0,
      },
    };
  },
};
