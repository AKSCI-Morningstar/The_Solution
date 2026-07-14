import { describe, expect, it } from "vitest";
import { validateFile } from "@/server/ingestion/pipeline/stages/file-validation";

describe("validateFile", () => {
  it("passes a well-formed, correctly-signed text file", () => {
    const buffer = Buffer.from("hello world");
    const issues = validateFile({ buffer, extension: "txt", sizeBytes: buffer.length });
    expect(issues).toEqual([]);
  });

  it("flags an unsupported extension", () => {
    const buffer = Buffer.from("hello");
    const issues = validateFile({ buffer, extension: "exe", sizeBytes: buffer.length });
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("UNSUPPORTED_FORMAT");
    expect(issues[0].severity).toBe("ERROR");
  });

  it("flags an empty file", () => {
    const buffer = Buffer.alloc(0);
    const issues = validateFile({ buffer, extension: "txt", sizeBytes: 0 });
    expect(issues.some((i) => i.code === "MALFORMED_DOCUMENT")).toBe(true);
  });

  it("flags a file whose content contradicts its claimed extension", () => {
    const buffer = Buffer.from("%PDF-1.4\n...");
    const issues = validateFile({ buffer, extension: "txt", sizeBytes: buffer.length });
    expect(issues.some((i) => i.code === "MALFORMED_DOCUMENT")).toBe(true);
  });

  it("flags a file exceeding the configured max size", () => {
    const buffer = Buffer.from("hello");
    const issues = validateFile({ buffer, extension: "txt", sizeBytes: 10 * 1024 * 1024 * 1024 });
    expect(issues.some((i) => i.message.includes("exceeds the maximum"))).toBe(true);
  });
});
