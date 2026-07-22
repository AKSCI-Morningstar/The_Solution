import { PDFParse } from "pdf-parse";

export interface ExtractedDrawingData {
  title: string | null;
  drawingNumber: string | null;
  revision: string | null;
  material: string | null;
  dimensions: string[];
  notes: string[];
  revHistory: string[];
}

export async function parseDrawingPdf(buffer: Buffer): Promise<ExtractedDrawingData> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const data = await parser.getText();
  const text = data.text;

  if (!text || text.trim().length === 0) {
    throw new Error("OCR could not detect text.");
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let title: string | null = null;
  let drawingNumber: string | null = null;
  let revision: string | null = null;
  let material: string | null = null;
  const dimensions: string[] = [];
  const notes: string[] = [];
  const revHistory: string[] = [];

  // Parse lines
  for (const line of lines) {
    // Titleblock details
    if (!title && line.toLowerCase().includes("title:")) {
      title = line.split(/title:/i)[1]?.trim() || null;
    }
    if (
      !drawingNumber &&
      (line.toLowerCase().includes("dwg no:") || line.toLowerCase().includes("drawing no:"))
    ) {
      drawingNumber = line.split(/(?:dwg|drawing)\s+no:/i)[1]?.trim() || null;
    }
    if (
      !revision &&
      (line.toLowerCase().includes("rev:") || line.toLowerCase().includes("revision:"))
    ) {
      revision = line.split(/rev(?:ision)?:/i)[1]?.trim() || null;
    }
    if (
      !material &&
      (line.toLowerCase().includes("matl:") || line.toLowerCase().includes("material:"))
    ) {
      material = line.split(/matl:|material:/i)[1]?.trim() || null;
    }

    // Dimensions
    if (
      line.includes("Ø") ||
      line.includes("±") ||
      /\b\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?\b/.test(line) ||
      /\d+(?:\.\d+)?\s*(?:deg|°)/i.test(line)
    ) {
      if (line.length < 50) {
        dimensions.push(line);
      }
    }

    // Notes
    if (/^\d+\.\s+[A-Z]/.test(line) && line.length > 5) {
      notes.push(line);
    }

    // Revision History
    if (line.startsWith("REV ") || line.includes("DESCRIPTION") || line.includes("APPROVED")) {
      revHistory.push(line);
    }
  }

  return {
    title: title || "Unknown Assembly",
    drawingNumber: drawingNumber || "DWG-UNKNOWN",
    revision: revision || "0",
    material: material || "Not specified",
    dimensions,
    notes,
    revHistory,
  };
}
