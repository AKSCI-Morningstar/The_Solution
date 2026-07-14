import type { EvidenceGraph, MissingEvidence } from "./types";
import {
  ENTITY_TYPES_REQUIRING_TESTS,
  ENTITY_TYPES_REQUIRING_CERTIFICATION,
  ENTITY_TYPES_REQUIRING_SPECIFICATION,
  ENTITY_TYPES_REQUIRING_APPROVAL,
} from "./constants";

export function detectMissingEvidence(graph: EvidenceGraph): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const seen = new Set<string>();
  const root = graph.nodes.get(graph.rootId);
  const rootEntityType = root?.entityType ?? "";

  if (ENTITY_TYPES_REQUIRING_TESTS.includes(rootEntityType)) {
    missing.push(...checkMissingTests(graph, seen));
  }
  if (ENTITY_TYPES_REQUIRING_CERTIFICATION.includes(rootEntityType)) {
    missing.push(...checkMissingCertification(graph, seen));
  }
  if (ENTITY_TYPES_REQUIRING_SPECIFICATION.includes(rootEntityType)) {
    missing.push(...checkMissingSpecification(graph, seen));
  }
  if (ENTITY_TYPES_REQUIRING_APPROVAL.includes(rootEntityType)) {
    missing.push(...checkMissingApproval(graph, seen));
  }

  missing.push(...checkMissingTraceability(graph, seen));
  missing.push(...checkMissingDocumentReferences(graph, seen));

  return missing;
}

function checkMissingTests(graph: EvidenceGraph, seen: Set<string>): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  const hasTests = graph.edges.some(
    (e) =>
      (e.targetId === graph.rootId || e.sourceId === graph.rootId) && e.relationType === "VERIFIES",
  );

  if (!hasTests) {
    const id = `missing:MISSING_TEST:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_TEST",
        label: `No tests verify "${root.label}"`,
        description: `No test entities verify this ${root.entityType}. Engineering evidence requires test verification for this entity type.`,
        entityId: root.entityId,
        entityType: root.entityType,
        requiredRelationshipType: "VERIFIES",
        severity: "HIGH",
      });
    }
  }

  return missing;
}

function checkMissingCertification(graph: EvidenceGraph, seen: Set<string>): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  const hasCert = Array.from(graph.nodes.values()).some(
    (n) =>
      n.type === "CERTIFICATION" &&
      graph.edges.some(
        (e) =>
          (e.sourceId === n.id && e.targetId === graph.rootId) ||
          (e.targetId === n.id && e.sourceId === graph.rootId),
      ),
  );

  if (!hasCert) {
    const id = `missing:MISSING_CERTIFICATION:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_CERTIFICATION",
        label: `No certification for "${root.label}"`,
        description: `No certification entities are linked to this ${root.entityType}. Certification is required for this entity type.`,
        entityId: root.entityId,
        entityType: root.entityType,
        requiredRelationshipType: "CERTIFIED_BY",
        severity: "HIGH",
      });
    }
  }

  return missing;
}

function checkMissingSpecification(graph: EvidenceGraph, seen: Set<string>): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  const hasSpec = Array.from(graph.nodes.values()).some(
    (n) =>
      n.type === "SPECIFICATION" &&
      graph.edges.some(
        (e) =>
          (e.sourceId === n.id && e.targetId === graph.rootId) ||
          (e.targetId === n.id && e.sourceId === graph.rootId),
      ),
  );

  if (!hasSpec) {
    const id = `missing:MISSING_SPECIFICATION:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_SPECIFICATION",
        label: `No specification for "${root.label}"`,
        description: `No specification entities are linked to this ${root.entityType}. A specification is required for this entity type.`,
        entityId: root.entityId,
        entityType: root.entityType,
        requiredRelationshipType: "REFERENCES",
        severity: "MEDIUM",
      });
    }
  }

  return missing;
}

function checkMissingApproval(graph: EvidenceGraph, seen: Set<string>): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  if (root.status && !["APPROVED", "ACTIVE"].includes(root.status)) {
    const id = `missing:MISSING_APPROVAL:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_APPROVAL",
        label: `"${root.label}" is not approved`,
        description: `This ${root.entityType} has status "${root.status}" but has not been approved. Approval is required for this entity type.`,
        entityId: root.entityId,
        entityType: root.entityType,
        severity: "MEDIUM",
      });
    }
  }

  return missing;
}

function checkMissingTraceability(graph: EvidenceGraph, seen: Set<string>): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  const hasIncoming = graph.edges.some((e) => e.targetId === graph.rootId);
  if (!hasIncoming) {
    const id = `missing:MISSING_TRACEABILITY:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_TRACEABILITY",
        label: `No traceability for "${root.label}"`,
        description: `This entity has no incoming relationships in the evidence graph. Traceability links are required to establish evidence chains.`,
        entityId: root.entityId,
        entityType: root.entityType,
        severity: "HIGH",
      });
    }
  }

  return missing;
}

function checkMissingDocumentReferences(
  graph: EvidenceGraph,
  seen: Set<string>,
): MissingEvidence[] {
  const missing: MissingEvidence[] = [];
  const root = graph.nodes.get(graph.rootId);
  if (!root) return missing;

  const hasDocRef = Array.from(graph.nodes.values()).some(
    (n) => n.type === "DOCUMENT" || n.type === "EXTRACTED_FACT",
  );

  if (!hasDocRef) {
    const id = `missing:MISSING_REFERENCE:${graph.rootId}`;
    if (!seen.has(id)) {
      seen.add(id);
      missing.push({
        id,
        type: "MISSING_REFERENCE",
        label: `No document references for "${root.label}"`,
        description: `No document or extracted fact evidence is linked to this entity. Document provenance is required for evidence verification.`,
        entityId: root.entityId,
        entityType: root.entityType,
        severity: "MEDIUM",
      });
    }
  }

  return missing;
}
