import type { ParsedSection } from "../../parsers";

const NUMBERED_HEADING = /^(\d+(?:\.\d+)*)\s+([A-Z][A-Za-z0-9 ,/&()-]{2,80})$/;
const ALL_CAPS_HEADING = /^[A-Z][A-Z0-9 ,/&()-]{2,80}$/;

/**
 * Heuristic heading detection for formats whose parser didn't already supply
 * sections (markdown/csv supply their own). Detects numbered headings
 * ("3.2 Interface Requirements") and standalone ALL-CAPS lines.
 */
export function detectSections(fullText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let offset = 0;

  for (const rawLine of fullText.split("\n")) {
    const line = rawLine.trim();

    const numbered = NUMBERED_HEADING.exec(line);
    if (numbered) {
      const level = numbered[1].split(".").length;
      sections.push({ title: numbered[2].trim(), level, startOffset: offset, page: null });
    } else if (
      line.length >= 3 &&
      line.length <= 80 &&
      ALL_CAPS_HEADING.test(line) &&
      /[A-Z]{3,}/.test(line)
    ) {
      sections.push({ title: line, level: 1, startOffset: offset, page: null });
    }

    offset += rawLine.length + 1;
  }

  return sections;
}
