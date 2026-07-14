import type { ParsedTable } from "../../parsers";

const PIPE_ROW = /^\s*\|(.+)\|\s*$/;
const PIPE_SEPARATOR_ROW = /^\s*\|?[\s:|-]+\|?\s*$/;

function splitPipeRow(line: string): string[] {
  const match = PIPE_ROW.exec(line);
  const inner = match ? match[1] : line;
  return inner.split("|").map((cell) => cell.trim());
}

/**
 * Detects markdown-style pipe tables in plain text for formats without a
 * native tabular structure (CSV already supplies its own table via the
 * parser and never reaches this stage).
 */
export function detectTables(fullText: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const lines = fullText.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (
      PIPE_ROW.test(line) &&
      i + 1 < lines.length &&
      PIPE_SEPARATOR_ROW.test(lines[i + 1].trim())
    ) {
      const headers = splitPipeRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && PIPE_ROW.test(lines[j].trim())) {
        rows.push(splitPipeRow(lines[j].trim()));
        j++;
      }
      tables.push({ page: null, headers, rows });
      i = j;
    } else {
      i++;
    }
  }

  return tables;
}
