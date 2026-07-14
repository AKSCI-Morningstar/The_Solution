import type { EvidenceGraph, EvidenceNode, Conflict } from "./types";
import { ENTITY_TYPE_LABELS } from "../engineering/constants";
import { STALE_THRESHOLD_DAYS } from "./constants";

function isStale(updatedAt: string): boolean {
  const age = Date.now() - new Date(updatedAt).getTime();
  return age > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

export function detectConflicts(graph: EvidenceGraph): Conflict[] {
  const conflicts: Conflict[] = [];
  const seen = new Set<string>();

  conflicts.push(...detectDuplicateNodes(graph, seen));
  conflicts.push(...detectSupersededNodes(graph, seen));
  conflicts.push(...detectStaleEvidence(graph, seen));
  conflicts.push(...detectBrokenReferences(graph, seen));
  conflicts.push(...detectConflictingSpecs(graph, seen));
  conflicts.push(...detectConflictingSuppliers(graph, seen));

  return conflicts;
}

function makeConflictId(type: string, ids: string[]): string {
  return `conflict:${type}:${ids.sort().join(",")}`;
}

function detectDuplicateNodes(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];
  const byName = new Map<string, EvidenceNode[]>();

  for (const node of graph.nodes.values()) {
    if (node.type !== "ENTITY") continue;
    const key = `${node.entityType}:${node.label.toLowerCase()}`;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(node);
  }

  for (const [, nodes] of byName) {
    if (nodes.length < 2) continue;
    const nodeIds = nodes.map((n) => n.id);
    const conflictId = makeConflictId("DUPLICATE_EVIDENCE", nodeIds);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "DUPLICATE_EVIDENCE",
      label: `Duplicate entities: ${nodes[0].label}`,
      description: `${nodes.length} entities share the same name and type "${ENTITY_TYPE_LABELS[nodes[0].entityType ?? ""] ?? nodes[0].entityType}". Possible duplicate evidence.`,
      nodeIds,
      entityType: nodes[0].entityType,
      severity: "MEDIUM",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectSupersededNodes(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const edge of graph.edges) {
    if (edge.relationType !== "SUPERSEDES") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;

    const conflictId = makeConflictId("OUTDATED_EVIDENCE", [edge.sourceId, edge.targetId]);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "OUTDATED_EVIDENCE",
      label: `${target.label} is superseded by ${source.label}`,
      description: `Evidence "${target.label}" has been superseded and may be outdated. Use "${source.label}" as the current source.`,
      nodeIds: [edge.sourceId, edge.targetId],
      entityType: target.entityType,
      severity: "HIGH",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectStaleEvidence(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const node of graph.nodes.values()) {
    if (node.type !== "ENTITY") continue;
    if (!isStale(node.updatedAt)) continue;
    if (node.status === "ACTIVE" || node.status === "APPROVED") continue;

    const conflictId = makeConflictId("OUTDATED_EVIDENCE", [node.id]);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "OUTDATED_EVIDENCE",
      label: `Stale evidence: ${node.label}`,
      description: `Evidence "${node.label}" has not been updated in over ${STALE_THRESHOLD_DAYS} days and has status "${node.status}". This evidence may be outdated.`,
      nodeIds: [node.id],
      entityType: node.entityType,
      severity: "MEDIUM",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectBrokenReferences(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];
  const nodeIds = new Set(graph.nodes.keys());

  for (const edge of graph.edges) {
    if (nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)) continue;

    const missing: string[] = [];
    if (!nodeIds.has(edge.sourceId)) missing.push(edge.sourceId);
    if (!nodeIds.has(edge.targetId)) missing.push(edge.targetId);

    const conflictId = makeConflictId("BROKEN_REFERENCE", [edge.id, ...missing]);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "BROKEN_REFERENCE",
      label: "Broken reference in evidence graph",
      description: `Edge "${edge.id}" references node(s) that are not in the evidence graph: ${missing.join(", ")}. This may indicate deleted entities or corrupted relationships.`,
      nodeIds: missing,
      severity: "HIGH",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectConflictingSpecs(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];
  const specsByEntity = new Map<string, EvidenceNode[]>();

  for (const edge of graph.edges) {
    if (edge.relationType !== "REFERENCES") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;

    if (source.type === "SPECIFICATION" && target.entityId) {
      if (!specsByEntity.has(target.entityId)) specsByEntity.set(target.entityId, []);
      specsByEntity.get(target.entityId)!.push(source);
    }
  }

  for (const [entityId, specs] of specsByEntity) {
    if (specs.length < 2) continue;
    const statuses = new Set(specs.map((s) => s.status));
    if (statuses.size <= 1) continue;

    const nodeIds = specs.map((s) => s.id);
    const conflictId = makeConflictId("CONFLICTING_SPECIFICATION", nodeIds);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "CONFLICTING_SPECIFICATION",
      label: `Conflicting specifications for entity`,
      description: `${specs.length} specifications with different statuses (${Array.from(statuses).join(", ")}) reference the same entity. This may indicate conflicting requirements.`,
      nodeIds,
      entityId,
      severity: "HIGH",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectConflictingSuppliers(graph: EvidenceGraph, seen: Set<string>): Conflict[] {
  const conflicts: Conflict[] = [];
  const suppliersByEntity = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.relationType !== "SUPPORTS") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;

    if (source.entityType === "SUPPLIER" && target.entityId) {
      if (!suppliersByEntity.has(target.entityId))
        suppliersByEntity.set(target.entityId, new Set());
      suppliersByEntity.get(target.entityId)!.add(source.id);
    }
  }

  for (const [entityId, supplierIds] of suppliersByEntity) {
    if (supplierIds.size < 2) continue;
    const nodeIds = Array.from(supplierIds);
    const conflictId = makeConflictId("CONFLICTING_SUPPLIER", nodeIds);
    if (seen.has(conflictId)) continue;
    seen.add(conflictId);

    conflicts.push({
      id: conflictId,
      type: "CONFLICTING_SUPPLIER",
      label: `Multiple suppliers for entity`,
      description: `${supplierIds.size} different suppliers are associated with the same entity. This may indicate a supply chain conflict or dual-sourcing.`,
      nodeIds,
      entityId,
      severity: "MEDIUM",
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}
