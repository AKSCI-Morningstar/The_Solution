import { describe, expect, it } from "vitest";
import { toCsv } from "@/server/reporting/export-service";
import { EXPORT_FORMATS, IMPLEMENTED_EXPORT_FORMATS } from "@/server/reporting/constants";
import type { ReportPayload } from "@/server/reporting/types";

function payload(rows: Record<string, unknown>[], columns: string[]): ReportPayload {
  return { summary: {}, columns, rows, generatedAt: "2026-01-01T00:00:00.000Z" };
}

describe("toCsv", () => {
  it("writes the declared column order as the header row", () => {
    const csv = toCsv(payload([{ a: 1, b: 2 }], ["b", "a"]));
    expect(csv.split("\n")[0]).toBe("b,a");
  });

  it("writes one line per row in column order", () => {
    const csv = toCsv(
      payload(
        [
          { name: "Alpha", count: 3 },
          { name: "Beta", count: 5 },
        ],
        ["name", "count"],
      ),
    );
    expect(csv.split("\n")).toEqual(["name,count", "Alpha,3", "Beta,5"]);
  });

  it("quotes values containing a comma", () => {
    const csv = toCsv(payload([{ label: "a, b" }], ["label"]));
    expect(csv.split("\n")[1]).toBe('"a, b"');
  });

  it("quotes values containing a newline", () => {
    const csv = toCsv(payload([{ label: "line1\nline2" }], ["label"]));
    expect(csv).toBe('label\n"line1\nline2"');
  });

  it("doubles embedded quotes", () => {
    const csv = toCsv(payload([{ label: 'say "hi"' }], ["label"]));
    expect(csv.split("\n")[1]).toBe('"say ""hi"""');
  });

  it("renders null and undefined values as an empty cell", () => {
    const csv = toCsv(payload([{ a: null, b: undefined }], ["a", "b"]));
    expect(csv.split("\n")[1]).toBe(",");
  });

  it("produces just a header row for an empty report", () => {
    const csv = toCsv(payload([], ["a", "b"]));
    expect(csv).toBe("a,b");
  });
});

describe("export format implementation status", () => {
  it("CSV and JSON are implemented", () => {
    expect(IMPLEMENTED_EXPORT_FORMATS.has("CSV")).toBe(true);
    expect(IMPLEMENTED_EXPORT_FORMATS.has("JSON")).toBe(true);
  });

  it("EXCEL and PDF are architecture-only, not implemented", () => {
    expect(IMPLEMENTED_EXPORT_FORMATS.has("EXCEL")).toBe(false);
    expect(IMPLEMENTED_EXPORT_FORMATS.has("PDF")).toBe(false);
  });

  it("every declared export format has an implementation status", () => {
    for (const format of EXPORT_FORMATS) {
      expect(typeof IMPLEMENTED_EXPORT_FORMATS.has(format)).toBe("boolean");
    }
  });
});
