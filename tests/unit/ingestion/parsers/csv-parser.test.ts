import { describe, expect, it } from "vitest";
import { csvParser, parseCsv } from "@/server/ingestion/parsers/csv-parser";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respects quoted fields containing commas", () => {
    expect(parseCsv('name,note\n"Acme, Inc.",supplier')).toEqual([
      ["name", "note"],
      ["Acme, Inc.", "supplier"],
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsv('id,label\n1,"say ""hi"""')).toEqual([
      ["id", "label"],
      ["1", 'say "hi"'],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("csvParser", () => {
  it("produces one table with headers and rows", async () => {
    const buffer = Buffer.from("identifier,entityType\nP/N-100,PART_NUMBER\nDWG-200,DRAWING\n");
    const result = await csvParser.parse(buffer, {
      fileName: "sample.csv",
      mimeType: "text/csv",
      extension: "csv",
    });

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].headers).toEqual(["identifier", "entityType"]);
    expect(result.tables[0].rows).toHaveLength(2);
    expect(result.metadata.rowCount).toBe(2);
    expect(result.metadata.columnCount).toBe(2);
  });
});
