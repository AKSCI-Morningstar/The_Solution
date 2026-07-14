import { describe, expect, it } from "vitest";
import { detectTables } from "@/server/ingestion/pipeline/stages/table-detection";

describe("detectTables", () => {
  it("detects a markdown-style pipe table", () => {
    const text = [
      "Intro paragraph.",
      "",
      "| Identifier | Type |",
      "| --- | --- |",
      "| P/N-100 | PART_NUMBER |",
      "| DWG-200 | DRAWING |",
      "",
      "Trailing paragraph.",
    ].join("\n");

    const tables = detectTables(text);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(["Identifier", "Type"]);
    expect(tables[0].rows).toEqual([
      ["P/N-100", "PART_NUMBER"],
      ["DWG-200", "DRAWING"],
    ]);
  });

  it("returns no tables for plain prose", () => {
    expect(detectTables("Just a normal paragraph with no tables at all.")).toEqual([]);
  });
});
