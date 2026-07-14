import type { ReferenceType } from "../constants";

export interface ReferenceExtractionRule {
  referenceType: ReferenceType;
  pattern: RegExp;
  confidence: number;
  method: string;
}

/** Deterministic regex rules detecting cross-references between engineering objects. */
export const REFERENCE_EXTRACTION_RULES: ReferenceExtractionRule[] = [
  {
    referenceType: "REQUIREMENT",
    pattern: /\bREQ(?:UIREMENT)?[\s#:.-]*(\d{2,8})\b/gi,
    confidence: 0.7,
    method: "regex:requirement-reference-v1",
  },
  {
    referenceType: "DRAWING",
    pattern: /\b(?:DWG|DRAWING)(?:\s+NO\.?)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{2,17})\b/gi,
    confidence: 0.7,
    method: "regex:drawing-reference-v1",
  },
  {
    referenceType: "PART",
    pattern: /\bP\/?N[\s#:.-]*([A-Z0-9][A-Z0-9-]{2,17})\b/gi,
    confidence: 0.7,
    method: "regex:part-reference-v1",
  },
  {
    referenceType: "SPECIFICATION",
    pattern: /\bSPEC(?:IFICATION)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{1,17})\b/gi,
    confidence: 0.65,
    method: "regex:specification-reference-v1",
  },
  {
    referenceType: "DOCUMENT",
    pattern: /\bDOC(?:UMENT)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{1,17})\b/gi,
    confidence: 0.6,
    method: "regex:document-reference-v1",
  },
  {
    referenceType: "REVISION",
    pattern: /\bREV(?:ISION)?[\s#:.-]*([A-Z0-9]{1,4})\b/gi,
    confidence: 0.6,
    method: "regex:revision-reference-v1",
  },
];
