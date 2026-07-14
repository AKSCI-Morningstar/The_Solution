import type { EntityType } from "@/server/engineering/constants";

export interface EntityExtractionRule {
  entityType: EntityType;
  pattern: RegExp;
  confidence: number;
  method: string;
}

/**
 * Deterministic, regex-only extraction rules - no AI/LLM/inference anywhere
 * in this list. Each rule must use the global flag so matchAll can enumerate
 * every occurrence. Adding a new rule (or a whole new entity type) requires
 * no changes anywhere else in the pipeline.
 */
export const ENTITY_EXTRACTION_RULES: EntityExtractionRule[] = [
  {
    entityType: "PART_NUMBER",
    pattern: /\bP\/?N[\s#:.-]*([A-Z0-9][A-Z0-9-]{2,17})\b/gi,
    confidence: 0.75,
    method: "regex:part-number-v1",
  },
  {
    entityType: "DRAWING",
    pattern: /\b(?:DWG|DRAWING)(?:\s+NO\.?)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{2,17})\b/gi,
    confidence: 0.75,
    method: "regex:drawing-v1",
  },
  {
    entityType: "REQUIREMENT",
    pattern: /\bREQ(?:UIREMENT)?[\s#:.-]*(\d{2,8})\b/gi,
    confidence: 0.75,
    method: "regex:requirement-id-v1",
  },
  {
    entityType: "SPECIFICATION",
    pattern: /\bSPEC(?:IFICATION)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{1,17})\b/gi,
    confidence: 0.7,
    method: "regex:specification-v1",
  },
  {
    entityType: "STANDARD",
    pattern:
      /\b(MIL-STD-\d+[A-Z]?|MIL-DTL-\d+[A-Z]?|ASTM\s?[A-Z]?\d+(?:-\d+)?|ISO\s?\d{3,6}|ANSI\s?[A-Z0-9.]+|SAE\s?[A-Z]{0,2}\d{2,4})\b/g,
    confidence: 0.85,
    method: "regex:standard-reference-v1",
  },
  {
    entityType: "TEST",
    pattern: /\b(?:TEST|TR)[\s#:.-]*(\d{2,8})\b/gi,
    confidence: 0.65,
    method: "regex:test-id-v1",
  },
  {
    entityType: "CERTIFICATION",
    pattern: /\bCERT(?:IFICATION)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{1,17})\b/gi,
    confidence: 0.7,
    method: "regex:certification-v1",
  },
  {
    entityType: "ENGINEERING_CHANGE",
    pattern: /\b(?:ECN|ECO|EC)[\s#:.-]*(\d{2,8})\b/g,
    confidence: 0.75,
    method: "regex:engineering-change-v1",
  },
  {
    entityType: "MATERIAL",
    pattern:
      /\b(aluminum|aluminium|titanium|stainless steel|carbon steel|carbon fiber|composite|inconel|copper|brass|bronze|polymer|nylon|kevlar)\b/gi,
    confidence: 0.5,
    method: "regex:material-keyword-v1",
  },
  {
    entityType: "PROCESS",
    pattern:
      /\b(anodizing|welding|heat treatment|machining|forging|casting|painting|plating|riveting|bonding)\b/gi,
    confidence: 0.5,
    method: "regex:process-keyword-v1",
  },
  {
    entityType: "INTERFACE",
    pattern: /\bInterface(?:\s+Control\s+Document)?[\s#:.-]*([A-Z0-9][A-Z0-9-]{1,17})\b/gi,
    confidence: 0.6,
    method: "regex:interface-v1",
  },
  {
    entityType: "SUPPLIER",
    pattern: /\bsupplied by\s+([A-Z][A-Za-z0-9&.,'-]{1,60})/g,
    confidence: 0.55,
    method: "regex:supplier-phrase-v1",
  },
  {
    entityType: "MANUFACTURER",
    pattern: /\bmanufactured by\s+([A-Z][A-Za-z0-9&.,'-]{1,60})/g,
    confidence: 0.55,
    method: "regex:manufacturer-phrase-v1",
  },
];
