export const RULE_STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export const RULE_SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

/**
 * Curated starting categories for the UI's category picker. Stored as a
 * plain string column (not a DB enum), so organizations can create rules
 * under any custom category string without a schema change.
 */
export const RULE_CATEGORIES = [
  "ENGINEERING",
  "REQUIREMENT",
  "SPECIFICATION",
  "MATERIAL",
  "MANUFACTURING",
  "CERTIFICATION",
  "COMPLIANCE",
  "SUPPLIER",
  "INTERFACE",
  "CONFIGURATION",
  "LIFECYCLE",
  "DOCUMENT",
  "RELATIONSHIP",
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number] | (string & {});

export const RULE_OUTCOMES = [
  "PASSED",
  "FAILED",
  "NEEDS_REVIEW",
  "BLOCKED",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type RuleOutcome = (typeof RULE_OUTCOMES)[number];

export const COMPARISON_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "in",
  "notIn",
] as const;
export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number];

export const RELATIONSHIP_DIRECTIONS = ["outgoing", "incoming"] as const;
export type RelationshipDirection = (typeof RELATIONSHIP_DIRECTIONS)[number];

export const RULE_AUDIT_ACTIONS = [
  "RULE_CREATED",
  "RULE_UPDATED",
  "RULE_DELETED",
  "RULE_EXECUTED",
  "RULE_EXECUTION_FAILED",
  "RULE_APPROVED",
  "RULE_PUBLISHED",
] as const;
export type RuleAuditAction = (typeof RULE_AUDIT_ACTIONS)[number];

/** Batch/dependency execution concurrency cap - mirrors the ingestion queue runner's pattern. */
export const RULE_EXECUTION_CONCURRENCY = 4;
