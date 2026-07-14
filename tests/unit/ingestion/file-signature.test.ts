import { describe, expect, it } from "vitest";
import { detectFormat, signatureMatchesExtension } from "@/server/ingestion/file-signature";

describe("detectFormat", () => {
  it("detects a PDF by its %PDF magic bytes", () => {
    const buffer = Buffer.from("%PDF-1.4\n...");
    expect(detectFormat(buffer)).toBe("pdf");
  });

  it("detects a zip/office document by its PK signature", () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(detectFormat(buffer)).toBe("zip-office");
  });

  it("detects a PNG by its signature", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectFormat(buffer)).toBe("png");
  });

  it("detects a JPEG by its signature", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectFormat(buffer)).toBe("jpeg");
  });

  it("classifies plain printable text as text", () => {
    const buffer = Buffer.from("Requirement REQ-1001: the bracket shall withstand load.");
    expect(detectFormat(buffer)).toBe("text");
  });

  it("classifies random binary noise as unknown", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x10, 0x11, 0xfe, 0xff, 0x05, 0x06]);
    expect(detectFormat(buffer)).toBe("unknown");
  });
});

describe("signatureMatchesExtension", () => {
  it("accepts a PDF whose bytes match its extension", () => {
    const buffer = Buffer.from("%PDF-1.4\n...");
    expect(signatureMatchesExtension(buffer, "pdf")).toBe(true);
  });

  it("rejects a file claiming to be a PDF but containing text", () => {
    const buffer = Buffer.from("just some plain text");
    expect(signatureMatchesExtension(buffer, "pdf")).toBe(false);
  });

  it("rejects a file claiming to be a DOCX but containing a PDF", () => {
    const buffer = Buffer.from("%PDF-1.4\n...");
    expect(signatureMatchesExtension(buffer, "docx")).toBe(false);
  });

  it("accepts a docx whose bytes are a zip container", () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(signatureMatchesExtension(buffer, "docx")).toBe(true);
  });

  it("is permissive for unrecognized extensions", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02]);
    expect(signatureMatchesExtension(buffer, "xyz")).toBe(true);
  });
});
