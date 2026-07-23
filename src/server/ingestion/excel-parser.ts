export interface ParsedSpreadsheet {
  sheetName: string;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Parses binary spreadsheet or text buffer into clean CSV-compatible row structures.
 * Auto-detects delimiters (, ; \t |) and extracts all columns and rows.
 */
export async function parseBinarySpreadsheet(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ParsedSpreadsheet> {
  const content = fileBuffer.toString("utf-8");

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { sheetName: "Sheet1", columns: [], rows: [], totalRows: 0 };
  }

  // Auto-detect delimiter if not obvious from extension
  let delimiter = ",";
  if (fileName.endsWith(".tsv")) {
    delimiter = "\t";
  } else {
    const firstLine = lines[0];
    if (firstLine.includes("\t")) delimiter = "\t";
    else if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes("|")) delimiter = "|";
  }

  const columns = lines[0].split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.replace(/^["']|["']$/g, "").trim());
    const rowObj: Record<string, string> = {};
    let hasValue = false;
    for (let j = 0; j < columns.length; j++) {
      const val = values[j] || "";
      rowObj[columns[j]] = val;
      if (val) hasValue = true;
    }
    if (hasValue) {
      rows.push(rowObj);
    }
  }

  return {
    sheetName: "Primary Worksheet",
    columns,
    rows,
    totalRows: rows.length,
  };
}
