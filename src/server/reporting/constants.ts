/** The 12 fixed, deterministic report types this platform supports - every generator is a pure aggregation over data other subsystems already persisted. */
export const REPORT_TYPES = [
  "EXECUTIVE",
  "ENGINEERING",
  "REQUIREMENT_COVERAGE",
  "EVIDENCE_COVERAGE",
  "CONTRADICTION",
  "RULE_COMPLIANCE",
  "SUPPLIER",
  "DOCUMENT_ACTIVITY",
  "KNOWLEDGE_GRAPH_STATISTICS",
  "ENGINEERING_HEALTH",
  "RISK_SUMMARY",
  "AUDIT",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  EXECUTIVE: "Executive Report",
  ENGINEERING: "Engineering Report",
  REQUIREMENT_COVERAGE: "Requirement Coverage Report",
  EVIDENCE_COVERAGE: "Evidence Coverage Report",
  CONTRADICTION: "Contradiction Report",
  RULE_COMPLIANCE: "Rule Compliance Report",
  SUPPLIER: "Supplier Report",
  DOCUMENT_ACTIVITY: "Document Activity Report",
  KNOWLEDGE_GRAPH_STATISTICS: "Knowledge Graph Statistics",
  ENGINEERING_HEALTH: "Engineering Health Report",
  RISK_SUMMARY: "Risk Summary Report",
  AUDIT: "Audit Report",
};

export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  EXECUTIVE: "A single-page rollup of every KPI in this platform for leadership review.",
  ENGINEERING: "Entity counts, statuses, and relationship density across the engineering graph.",
  REQUIREMENT_COVERAGE: "What share of requirements have at least one traceable relationship.",
  EVIDENCE_COVERAGE:
    "What share of engineering entities have at least one linked evidence reference.",
  CONTRADICTION: "Open and resolved contradictions broken down by type and severity.",
  RULE_COMPLIANCE: "Rule execution outcomes and the resulting pass rate.",
  SUPPLIER: "Supplier and manufacturer entities plus supplier-related contradictions.",
  DOCUMENT_ACTIVITY: "Ingestion document and job volume, status breakdown, and recent activity.",
  KNOWLEDGE_GRAPH_STATISTICS: "Node and edge counts and growth over time.",
  ENGINEERING_HEALTH:
    "A composite view combining rule compliance, evidence coverage, and contradiction density.",
  RISK_SUMMARY:
    "Open critical/high-severity contradictions, failed rules, and missing-evidence counts.",
  AUDIT: "Audit log activity by action, entity, and actor over time.",
};

/** Formats this platform can export a generated report into. CSV and JSON are fully generated; PDF and Excel are architecture-only in this foundation (see docs/export-system.md). */
export const EXPORT_FORMATS = ["CSV", "JSON", "EXCEL", "PDF"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const IMPLEMENTED_EXPORT_FORMATS: ReadonlySet<ExportFormat> = new Set(["CSV", "JSON"]);

export const REPORTING_AUDIT_ACTIONS = [
  "REPORT_GENERATED",
  "REPORT_VIEWED",
  "REPORT_EXPORTED",
  "REPORT_DELETED",
  "REPORT_FAVORITED",
  "REPORT_UNFAVORITED",
] as const;
export type ReportingAuditAction = (typeof REPORTING_AUDIT_ACTIONS)[number];

/** Entity types treated as suppliers for the Supplier Report - mirrors the Contradiction and Evidence engines' own supplier detection. */
export const SUPPLIER_ENTITY_TYPES = ["SUPPLIER", "MANUFACTURER"] as const;

/** Contradiction severities treated as "at risk" for the Risk Summary Report. */
export const HIGH_RISK_CONTRADICTION_SEVERITIES = ["CRITICAL", "HIGH"] as const;

/** Contradiction statuses considered still open (mirrors the Reality Engine's own definition). */
export const OPEN_CONTRADICTION_STATUSES = ["DETECTED", "UNDER_REVIEW"] as const;

/** Default trend window for growth/activity charts, in days. */
export const DEFAULT_TREND_WINDOW_DAYS = 30;
