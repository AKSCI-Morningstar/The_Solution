import { describe, expect, it } from "vitest";
import {
  REPORT_TYPES,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_LABELS,
  EXPORT_FORMATS,
} from "@/server/reporting/constants";

describe("REPORT_TYPES data integrity", () => {
  it("defines exactly the 12 mission-specified report types", () => {
    expect(REPORT_TYPES).toHaveLength(12);
    expect([...REPORT_TYPES].sort()).toEqual(
      [
        "EXECUTIVE",
        "ENGINEERING",
        "REQUIREMENT_COVERAGE",
        "EVIDENCE_COVERAGE",
        "CONTRADICTION",
        "RULE_COMPLIANCE",
        "SUPPLIER",
        "DOCUMENT_ACTIVITY",
        "KNOWLEDGE_GRAPH_STATISTICS",
        "ENGINEERING_HEALTH",
        "RISK_SUMMARY",
        "AUDIT",
      ].sort(),
    );
  });

  it("every report type has a label", () => {
    for (const type of REPORT_TYPES) {
      expect(REPORT_TYPE_LABELS[type], `${type} is missing a label`).toBeTruthy();
    }
  });

  it("every report type has a description", () => {
    for (const type of REPORT_TYPES) {
      expect(REPORT_TYPE_DESCRIPTIONS[type], `${type} is missing a description`).toBeTruthy();
    }
  });

  it("every report type is unique", () => {
    expect(new Set(REPORT_TYPES).size).toBe(REPORT_TYPES.length);
  });
});

describe("EXPORT_FORMATS data integrity", () => {
  it("includes CSV, JSON, EXCEL, and PDF", () => {
    expect([...EXPORT_FORMATS].sort()).toEqual(["CSV", "EXCEL", "JSON", "PDF"]);
  });
});
