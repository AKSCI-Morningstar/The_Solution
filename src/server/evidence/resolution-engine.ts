import type {
  ResolutionResult,
  EvidenceSummary,
  EvidenceQualityIndicator,
  EvidenceNode,
  EvidenceGraph,
} from "./types";
import type { ResolutionStatus, EvidenceQuality } from "./constants";
import { buildEvidenceGraph, getSupportingNodes, getConflictingNodes } from "./evidence-graph";
import { buildEvidenceChains } from "./evidence-chain";
import { detectConflicts } from "./conflict-detector";
import { detectMissingEvidence } from "./missing-evidence-detector";
import { buildTraceabilityGraph } from "./traceability-builder";

export async function evaluateEvidence(
  organizationId: string,
  entityId: string,
  maxDepth: number = 5,
): Promise<ResolutionResult> {
  const graph = await buildEvidenceGraph(organizationId, entityId, maxDepth);
  const root = graph.nodes.get(graph.rootId);

  const supporting = getSupportingNodes(graph, graph.rootId);
  const conflicting = getConflictingNodes(graph, graph.rootId);
  const conflicts = detectConflicts(graph);
  const missing = detectMissingEvidence(graph);
  const chains = buildEvidenceChains(graph, graph.rootId, maxDepth);
  const traceability = await buildTraceabilityGraph(organizationId, entityId, maxDepth);
  const qualityIndicators = computeQualityIndicators(graph, supporting, conflicting, missing);
  const summary = computeSummary(graph, supporting, conflicting, missing);
  const status = resolveStatus(
    supporting,
    conflicting,
    missing as { severity: string }[],
    qualityIndicators,
  );

  return {
    status,
    subjectId: entityId,
    subjectLabel: root?.label ?? "Unknown",
    supportingEvidence: supporting,
    conflictingEvidence: conflicting,
    missingEvidence: missing,
    evidenceChains: chains,
    traceabilityGraph: traceability,
    conflicts,
    qualityIndicators,
    summary,
    resolvedAt: new Date().toISOString(),
  };
}

function resolveStatus(
  supporting: EvidenceNode[],
  conflicting: EvidenceNode[],
  missing: { severity: string }[],
  quality: EvidenceQualityIndicator,
): ResolutionStatus {
  if (conflicting.length > 0) {
    return "CONFLICTING";
  }

  if (missing.some((m) => m.severity === "HIGH")) {
    return "INSUFFICIENT";
  }

  if (missing.length > 0) {
    return "INCOMPLETE";
  }

  if (quality.quality === "OUTDATED") {
    return "NEEDS_REVIEW";
  }

  if (supporting.length > 0 && quality.quality === "COMPLETE") {
    return "VERIFIED";
  }

  if (supporting.length > 0) {
    return "SUFFICIENT";
  }

  return "INSUFFICIENT";
}

function computeQualityIndicators(
  graph: EvidenceGraph,
  supporting: EvidenceNode[],
  conflicting: EvidenceNode[],
  missing: unknown[],
): EvidenceQualityIndicator {
  const allNodes = Array.from(graph.nodes.values());
  const totalNodes = allNodes.length;

  const hasDocumentProvenance = allNodes.some((n) => n.documentId);
  const hasVersionInfo = allNodes.some((n) => n.version);
  const hasPageReferences = allNodes.some((n) => n.page !== undefined);
  const hasExtractionSource = allNodes.some((n) => n.extractionMethod);

  let quality: EvidenceQuality;
  if (conflicting.length > 0) {
    quality = "CONFLICTING";
  } else if (missing.length > 0) {
    quality = "INCOMPLETE";
  } else if (allNodes.some((n) => isStale(n))) {
    quality = "OUTDATED";
  } else if (totalNodes > 0 && hasDocumentProvenance && hasVersionInfo) {
    quality = "COMPLETE";
  } else if (totalNodes > 0) {
    quality = "NEEDS_REVIEW";
  } else {
    quality = "INCOMPLETE";
  }

  return {
    totalNodes,
    supportingNodes: supporting.length,
    conflictingNodes: conflicting.length,
    missingNodes: missing.length,
    hasDocumentProvenance,
    hasVersionInfo,
    hasPageReferences,
    hasExtractionSource,
    quality,
  };
}

function isStale(node: EvidenceNode): boolean {
  const age = Date.now() - new Date(node.updatedAt).getTime();
  return age > 365 * 24 * 60 * 60 * 1000;
}

function computeSummary(
  graph: EvidenceGraph,
  supporting: EvidenceNode[],
  conflicting: EvidenceNode[],
  missing: unknown[],
): EvidenceSummary {
  const allNodes = Array.from(graph.nodes.values());
  const documents = new Set<string>();
  const entities = new Set<string>();

  for (const node of allNodes) {
    if (node.documentId) documents.add(node.documentId);
    if (node.entityId) entities.add(node.entityId);
  }

  const timestamps = allNodes
    .map((n) => n.updatedAt)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    totalEvidence: allNodes.length,
    supportingEvidence: supporting.length,
    conflictingEvidence: conflicting.length,
    missingEvidence: missing.length,
    uniqueDocuments: documents.size,
    uniqueEntities: entities.size,
    oldestEvidence: timestamps[0] ?? null,
    newestEvidence: timestamps[timestamps.length - 1] ?? null,
  };
}
