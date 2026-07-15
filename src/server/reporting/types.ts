/** One point in a day-bucketed trend series. */
export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  kpis: {
    totalEntities: number;
    totalDocuments: number;
    totalRelationships: number;
    evidenceCompletenessPercent: number;
    requirementCoveragePercent: number;
    rulePassRatePercent: number;
    contradictionDensityPercent: number;
    openContradictionCount: number;
    knowledgeGraphNodeCount: number;
    knowledgeGraphEdgeCount: number;
  };
  trends: {
    knowledgeGraphGrowth: TrendPoint[];
    engineeringActivity: TrendPoint[];
    documentActivity: TrendPoint[];
    auditActivity: TrendPoint[];
  };
  ruleOutcomeBreakdown: Record<string, number>;
  contradictionSeverityBreakdown: Record<string, number>;
  entityTypeBreakdown: Record<string, number>;
  organizationMemberRoleBreakdown: Record<string, number>;
}

/** The generic shape every report generator returns - persisted verbatim as Report.data. */
export interface ReportPayload {
  summary: Record<string, number | string>;
  columns: string[];
  rows: Record<string, unknown>[];
  generatedAt: string;
}
