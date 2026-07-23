export const SUPPORTED_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "xlsx",
  "xls",
  "docx",
  "doc",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "step",
  "stp",
  "dxf",
  "dwg",
  "cad",
  "json",
  "xml",
  "yaml",
  "yml",
  "log",
  "zip",
  "rtf",
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export const JOB_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EXTRACTION_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "REQUIREMENTS_DOCUMENT",
  "DRAWING_REGISTER",
  "TEST_REPORT",
  "SPECIFICATION",
  "CHANGE_NOTICE",
  "GENERIC",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  REQUIREMENTS_DOCUMENT: "Requirements Document",
  DRAWING_REGISTER: "Drawing Register",
  TEST_REPORT: "Test Report",
  SPECIFICATION: "Specification",
  CHANGE_NOTICE: "Change Notice",
  GENERIC: "Generic Document",
};

export const REFERENCE_TYPES = [
  "REQUIREMENT",
  "DRAWING",
  "PART",
  "SPECIFICATION",
  "DOCUMENT",
  "REVISION",
] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  REQUIREMENT: "Requirement Reference",
  DRAWING: "Drawing Reference",
  PART: "Part Reference",
  SPECIFICATION: "Specification Reference",
  DOCUMENT: "Document Reference",
  REVISION: "Revision Reference",
};

export const VALIDATION_ISSUE_CODES = [
  "MALFORMED_DOCUMENT",
  "UNSUPPORTED_FORMAT",
  "DUPLICATE_ENTITY",
  "BROKEN_REFERENCE",
  "MISSING_METADATA",
  "EXTRACTION_INCONSISTENCY",
] as const;
export type ValidationIssueCode = (typeof VALIDATION_ISSUE_CODES)[number];

export const VALIDATION_SEVERITIES = ["ERROR", "WARNING", "INFO"] as const;
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

/**
 * Canonical, ordered pipeline stage names. Index in this array is the
 * stage's progress checkpoint (IngestionJob.stageIndex / totalStages).
 */
export const PIPELINE_STAGES = [
  "FILE_VALIDATION",
  "DOCUMENT_CLASSIFICATION",
  "METADATA_EXTRACTION",
  "STRUCTURAL_PARSING",
  "SECTION_DETECTION",
  "TABLE_DETECTION",
  "ENTITY_EXTRACTION",
  "RELATIONSHIP_EXTRACTION",
  "REFERENCE_EXTRACTION",
  "VALIDATION",
  "PROVENANCE_ASSIGNMENT",
  "GRAPH_PREPARATION",
  "PERSISTENCE",
] as const;
export type PipelineStageName = (typeof PIPELINE_STAGES)[number];

export const MAX_UPLOAD_FILENAME_LENGTH = 255;
