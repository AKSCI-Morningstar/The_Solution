/**
 * Magic-byte based file signature detection. Used so a mislabeled extension
 * or mimetype cannot smuggle a different (potentially unsafe) file type
 * through validation - we sniff the actual bytes, not just trust the client.
 */

export type DetectedFormat =
  | "pdf"
  | "zip-office" // .docx/.xlsx/.pptx are all zip containers
  | "png"
  | "jpeg"
  | "gif"
  | "text"
  | "unknown";

interface Signature {
  format: DetectedFormat;
  bytes: number[];
  offset?: number;
}

const SIGNATURES: Signature[] = [
  { format: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { format: "zip-office", bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK\x03\x04
  { format: "zip-office", bytes: [0x50, 0x4b, 0x05, 0x06] }, // empty zip
  { format: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { format: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { format: "gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
];

function matchesAt(buffer: Buffer, offset: number, bytes: number[]): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/** Returns the ratio (0-1) of bytes in the sample that are printable/whitespace ASCII or valid UTF-8 lead bytes. */
function printableRatio(buffer: Buffer): number {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.length === 0) return 1;
  let printable = 0;
  for (const byte of sample) {
    const isControl = byte < 0x09 || (byte > 0x0d && byte < 0x20);
    if (!isControl) printable++;
  }
  return printable / sample.length;
}

export function detectFormat(buffer: Buffer): DetectedFormat {
  for (const sig of SIGNATURES) {
    if (matchesAt(buffer, sig.offset ?? 0, sig.bytes)) {
      return sig.format;
    }
  }
  if (printableRatio(buffer) > 0.95) {
    return "text";
  }
  return "unknown";
}

const EXTENSION_EXPECTATIONS: Record<string, DetectedFormat[]> = {
  pdf: ["pdf"],
  docx: ["zip-office"],
  png: ["png"],
  jpg: ["jpeg"],
  jpeg: ["jpeg"],
  gif: ["gif"],
  txt: ["text"],
  md: ["text"],
  markdown: ["text"],
  csv: ["text"],
};

/** True if the file's actual byte signature is consistent with its claimed extension. */
export function signatureMatchesExtension(buffer: Buffer, extension: string): boolean {
  const normalized = extension.toLowerCase().replace(/^\./, "");
  const expected = EXTENSION_EXPECTATIONS[normalized];
  if (!expected) return true; // unknown extension: nothing to contradict, other validation will reject it
  return expected.includes(detectFormat(buffer));
}
