import { describe, expect, it } from "vitest";
import { classifyDocument } from "@/server/ingestion/pipeline/stages/document-classification";

describe("classifyDocument", () => {
  it("classifies a requirements document", () => {
    const text = "System Requirements\n\nREQ-1001: The bracket shall withstand 500N of load.";
    expect(classifyDocument(text, "requirements.txt")).toBe("REQUIREMENTS_DOCUMENT");
  });

  it("classifies a drawing register", () => {
    const text = "Drawing Register\nDWG-1001 Rev A\nDWG-1002 Rev B\nRevision History below.";
    expect(classifyDocument(text, "dwg-register.csv")).toBe("DRAWING_REGISTER");
  });

  it("classifies a test report", () => {
    const text = "Test Report\nTest results: Pass/Fail summary for unit 44.";
    expect(classifyDocument(text, "report.txt")).toBe("TEST_REPORT");
  });

  it("classifies a change notice", () => {
    const text = "Engineering Change Notice ECN-2024: update bracket material.";
    expect(classifyDocument(text, "ecn.txt")).toBe("CHANGE_NOTICE");
  });

  it("falls back to GENERIC when nothing scores", () => {
    expect(classifyDocument("just some unrelated prose about lunch.", "notes.txt")).toBe("GENERIC");
  });
});
