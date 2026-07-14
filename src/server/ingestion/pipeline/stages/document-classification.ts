import type { DocumentType } from "../../constants";

interface ClassificationRule {
  documentType: Exclude<DocumentType, "GENERIC">;
  keywords: RegExp[];
}

/** Keyword/structure heuristics only - no AI, no inference beyond literal text matching. */
const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    documentType: "REQUIREMENTS_DOCUMENT",
    keywords: [/\bshall\b/i, /\brequirements?\b/i, /\bREQ[\s#:.-]*\d/i],
  },
  {
    documentType: "DRAWING_REGISTER",
    keywords: [/\bdrawing register\b/i, /\bDWG[\s#:.-]*[A-Z0-9]/i, /\brevision history\b/i],
  },
  {
    documentType: "TEST_REPORT",
    keywords: [/\btest report\b/i, /\btest results?\b/i, /\bpass(?:ed)?\/fail(?:ed)?\b/i],
  },
  {
    documentType: "SPECIFICATION",
    keywords: [/\bspecification\b/i, /\bSPEC[\s#:.-]*[A-Z0-9]/i],
  },
  {
    documentType: "CHANGE_NOTICE",
    keywords: [/\bengineering change\b/i, /\bECN\b/i, /\bECO\b/i, /\bchange notice\b/i],
  },
];

/** Scores each rule by keyword-match count against fileName + text and returns the best match, or GENERIC if nothing scores. */
export function classifyDocument(text: string, fileName: string): DocumentType {
  const haystack = `${fileName}\n${text}`;
  let bestType: DocumentType = "GENERIC";
  let bestScore = 0;

  for (const rule of CLASSIFICATION_RULES) {
    const score = rule.keywords.reduce(
      (count, keyword) => (keyword.test(haystack) ? count + 1 : count),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestType = rule.documentType;
    }
  }

  return bestType;
}
