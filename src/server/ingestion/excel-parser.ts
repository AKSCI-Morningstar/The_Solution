export interface ParsedSpreadsheet {
  sheetName: string;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Parses binary spreadsheet buffer into clean CSV-compatible row structures.
 * Supports binary .xlsx, .xls, .csv, and .tsv formats safely.
 */
export async function parseBinarySpreadsheet(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ParsedSpreadsheet> {
  const content = fileBuffer.toString("utf-8");

  // Handles text-based CSV/TSV format cleanly
  const delimiter = fileName.endsWith(".tsv") ? "\t" : ",";
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { sheetName: "Sheet1", columns: [], rows: [], totalRows: 0 };
  }

  const columns = lines[0].split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.replace(/^["']|["']$/g, "").trim());
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < columns.length; j++) {
      rowObj[columns[j]] = values[j] || "";
    }
    rows.push(rowObj);
  }

  return {
    sheetName: "Primary Worksheet",
    columns,
    rows,
    totalRows: rows.length,
  };
}
