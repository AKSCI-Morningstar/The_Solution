import {
  generateEngineeringHealthReport,
  generateExecutiveReport,
  generateRiskSummaryReport,
} from "./executive";
import {
  generateEngineeringReport,
  generateEvidenceCoverageReport,
  generateKnowledgeGraphStatisticsReport,
  generateRequirementCoverageReport,
} from "./engineering";
import {
  generateContradictionReport,
  generateRuleComplianceReport,
  generateSupplierReport,
} from "./compliance";
import { generateAuditReport, generateDocumentActivityReport } from "./operations";
import type { ReportType } from "../constants";
import type { ReportFiltersInput } from "../validation";
import type { ReportPayload } from "../types";

type ReportGenerator = (
  organizationId: string,
  filters: ReportFiltersInput,
) => Promise<ReportPayload>;

const GENERATORS: Record<ReportType, ReportGenerator> = {
  EXECUTIVE: generateExecutiveReport,
  ENGINEERING: generateEngineeringReport,
  REQUIREMENT_COVERAGE: generateRequirementCoverageReport,
  EVIDENCE_COVERAGE: generateEvidenceCoverageReport,
  CONTRADICTION: generateContradictionReport,
  RULE_COMPLIANCE: generateRuleComplianceReport,
  SUPPLIER: generateSupplierReport,
  DOCUMENT_ACTIVITY: generateDocumentActivityReport,
  KNOWLEDGE_GRAPH_STATISTICS: generateKnowledgeGraphStatisticsReport,
  ENGINEERING_HEALTH: generateEngineeringHealthReport,
  RISK_SUMMARY: generateRiskSummaryReport,
  AUDIT: generateAuditReport,
};

/** Dispatches to the deterministic generator for the given report type - the one place the fixed type-to-generator mapping is defined. */
export async function generateReportData(
  type: ReportType,
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  return GENERATORS[type](organizationId, filters);
}
