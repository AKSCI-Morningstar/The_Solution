import { recordAuditEvent } from "@/server/audit";
import { IMPLEMENTED_EXPORT_FORMATS } from "./constants";
import type { ExportFormat } from "./constants";
import type { ReportPayload } from "./types";

export interface ExportResult {
  implemented: boolean;
  format: ExportFormat;
  mimeType?: string;
  fileName?: string;
  content?: string;
  architectureNote?: string;
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

/** Converts a report payload's rows into CSV text using its own declared column order. */
export function toCsv(payload: ReportPayload): string {
  const header = payload.columns.join(",");
  const lines = payload.rows.map((row) =>
    payload.columns.map((col) => csvEscape(row[col])).join(","),
  );
  return [header, ...lines].join("\n");
}

/**
 * Excel export is architecture-only in this foundation: this platform has no
 * spreadsheet-generation dependency installed, and adding one is an explicit
 * out-of-scope decision for this milestone (see docs/export-system.md). The
 * documented integration seam is here - a real implementation would replace
 * this function's body with a proper OOXML (.xlsx) writer fed the same
 * `ReportPayload.columns`/`rows` this CSV/JSON path already uses.
 */
function architectureOnlyNote(format: "EXCEL" | "PDF"): string {
  return format === "EXCEL"
    ? "Excel export architecture: ReportPayload.columns/rows are already shaped for a tabular writer. Wire in a spreadsheet library (e.g. exceljs) here to produce a real .xlsx workbook."
    : "PDF export architecture: use the report's print-friendly view (/reports/[id]?print=1) as the rendering source, then wire in a headless-browser or PDF-generation library here to produce a real .pdf file.";
}

function fileNameFor(reportId: string, format: ExportFormat): string {
  const extension = format.toLowerCase() === "excel" ? "xls" : format.toLowerCase();
  return `report-${reportId}.${extension}`;
}

export async function generateExport(
  organizationId: string,
  reportId: string,
  reportTitle: string,
  payload: ReportPayload,
  format: ExportFormat,
): Promise<ExportResult> {
  if (!IMPLEMENTED_EXPORT_FORMATS.has(format)) {
    return {
      implemented: false,
      format,
      architectureNote: architectureOnlyNote(format as "EXCEL" | "PDF"),
    };
  }

  const result: ExportResult =
    format === "CSV"
      ? {
          implemented: true,
          format,
          mimeType: "text/csv",
          fileName: fileNameFor(reportId, format),
          content: toCsv(payload),
        }
      : {
          implemented: true,
          format,
          mimeType: "application/json",
          fileName: fileNameFor(reportId, format),
          content: JSON.stringify({ title: reportTitle, ...payload }, null, 2),
        };

  await recordAuditEvent(organizationId, "REPORT_EXPORTED", "Report", reportId, { format });
  return result;
}
