import type { EvidenceGraph, EvidenceNode, EvidenceEdge } from "../evidence/types";
import type {
  ContradictionRecord,
  ContradictionDetectionResult,
  ContradictionEvidence,
  ContradictionTraceabilityRecord,
  AffectedEntity,
} from "./types";
import type { ContradictionType, ContradictionSeverity } from "./constants";
import { STALE_THRESHOLD_DAYS } from "../evidence/constants";

function isStale(updatedAt: string): boolean {
  const age = Date.now() - new Date(updatedAt).getTime();
  return age > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

function makeId(type: string, ids: string[]): string {
  return `contradiction:${type}:${[...ids].sort().join(",")}`;
}

function toEvidence(node: EvidenceNode): ContradictionEvidence {
  return {
    nodeId: node.id,
    label: node.label,
    entityType: node.entityType,
    status: node.status,
    version: node.version,
    documentId: node.documentId,
    documentName: node.documentName,
    documentVersion: node.documentVersion,
    page: node.page,
    section: node.section,
    extractionMethod: node.extractionMethod,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

function toTraceability(
  node: EvidenceNode,
  path: string[],
): ContradictionTraceabilityRecord {
  return {
    entityId: node.entityId ?? node.id,
    entityName: node.label,
    entityType: node.entityType ?? node.type,
    entityIdentifier: node.entityId ?? node.id,
    entityVersion: node.version ?? "unknown",
    entityStatus: node.status ?? "unknown",
    documentId: node.documentId,
    documentName: node.documentName,
    documentVersion: node.documentVersion,
    page: node.page,
    section: node.section,
    relationshipPath: path,
    extractionMethod: node.extractionMethod,
    timestamp: node.updatedAt,
  };
}

function toAffected(
  node: EvidenceNode,
  relationship: string,
): AffectedEntity {
  return {
    entityId: node.entityId ?? node.id,
    entityName: node.label,
    entityType: node.entityType ?? node.type,
    entityIdentifier: node.entityId ?? node.id,
    relationship,
  };
}

export function detectContradictions(
  graph: EvidenceGraph,
  organizationId: string,
): ContradictionDetectionResult {
  const contradictions: ContradictionRecord[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();

  contradictions.push(...detectRequirementContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectSpecificationContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectMaterialContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectSupplierContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectInterfaceContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectVersionContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectLifecycleContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectRelationshipContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectCertificationContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectDocumentContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectEvidenceContradictions(graph, organizationId, seen, now));
  contradictions.push(...detectStaleEvidence(graph, organizationId, seen, now));
  contradictions.push(...detectBrokenReferences(graph, organizationId, seen, now));
  contradictions.push(...detectDuplicateEntities(graph, organizationId, seen, now));

  const insufficientCount = contradictions.filter(
    (c) => c.severity === "BLOCKED_BY_MISSING_EVIDENCE",
  ).length;

  return {
    contradictions,
    totalDetected: contradictions.length,
    insufficientEvidenceCount: insufficientCount,
    detectedAt: now,
  };
}

function makeContradiction(
  id: string,
  type: ContradictionType,
  severity: ContradictionSeverity,
  label: string,
  description: string,
  nodes: EvidenceNode[],
  edges: EvidenceEdge[],
  _graph: EvidenceGraph,
  organizationId: string,
  detectedAt: string,
): ContradictionRecord {
  const entityIds = nodes
    .map((n) => n.entityId)
    .filter((id): id is string => id !== undefined);
  const documentIds = nodes
    .map((n) => n.documentId)
    .filter((id): id is string => id !== undefined);

  const supporting = nodes.filter((n) => n.status === "ACTIVE" || n.status === "APPROVED");
  const conflicting = nodes.filter((n) => n.status !== "ACTIVE" && n.status !== "APPROVED");

  return {
    id,
    organizationId,
    type,
    severity,
    status: "DETECTED",
    label,
    description,
    sourceEntityIds: [...new Set(entityIds)],
    sourceDocumentIds: [...new Set(documentIds)],
    supportingEvidence: supporting.map(toEvidence),
    conflictingEvidence: conflicting.map(toEvidence),
    traceabilityChain: nodes.map((n) => toTraceability(n, edges.map((e) => e.relationType))),
    affectedEntities: nodes.map((n) => toAffected(n, "directly_involved")),
    detectedAt,
  };
}

function detectRequirementContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const requirements = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "REQUIREMENT" || n.type === "REQUIREMENT",
  );

  const byTarget = new Map<string, EvidenceNode[]>();
  for (const req of requirements) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === req.id && (e.relationType === "REFERENCES" || e.relationType === "SUPPORTS"),
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      if (!byTarget.has(target.entityId)) byTarget.set(target.entityId, []);
      byTarget.get(target.entityId)!.push(req);
    }
  }

  for (const [, reqs] of byTarget) {
    if (reqs.length < 2) continue;
    const statuses = new Set(reqs.map((r) => r.status));
    if (statuses.size <= 1 && reqs.every((r) => r.status === "ACTIVE")) continue;

    const ids = reqs.map((r) => r.id);
    const id = makeId("REQUIREMENT_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    const severity = reqs.some((r) => r.status === "REJECTED") ? "CRITICAL" : "HIGH";
    results.push(
      makeContradiction(
        id,
        "REQUIREMENT_CONTRADICTION",
        severity,
        `Conflicting requirements: ${reqs.map((r) => r.label).join(" vs ")}`,
        `${reqs.length} requirements with statuses (${Array.from(statuses).join(", ")}) reference the same target. These requirements cannot simultaneously be satisfied.`,
        reqs,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectSpecificationContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const specs = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "SPECIFICATION" || n.type === "SPECIFICATION",
  );

  const byTarget = new Map<string, EvidenceNode[]>();
  for (const spec of specs) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === spec.id && e.relationType === "REFERENCES",
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      if (!byTarget.has(target.entityId)) byTarget.set(target.entityId, []);
      byTarget.get(target.entityId)!.push(spec);
    }
  }

  for (const [, specList] of byTarget) {
    if (specList.length < 2) continue;
    const statuses = new Set(specList.map((s) => s.status));
    if (statuses.size <= 1) continue;

    const ids = specList.map((s) => s.id);
    const id = makeId("SPECIFICATION_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "SPECIFICATION_CONTRADICTION",
        "HIGH",
        `Conflicting specifications: ${specList.map((s) => s.label).join(" vs ")}`,
        `${specList.length} specifications with different statuses (${Array.from(statuses).join(", ")}) reference the same entity. These specifications present incompatible parameters.`,
        specList,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectMaterialContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const materials = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "MATERIAL",
  );

  const byComponent = new Map<string, EvidenceNode[]>();
  for (const mat of materials) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === mat.id && e.relationType === "SUPPORTS",
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      if (!byComponent.has(target.entityId)) byComponent.set(target.entityId, []);
      byComponent.get(target.entityId)!.push(mat);
    }
  }

  for (const [, mats] of byComponent) {
    if (mats.length < 2) continue;
    const ids = mats.map((m) => m.id);
    const id = makeId("MATERIAL_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "MATERIAL_CONTRADICTION",
        "HIGH",
        `Conflicting materials: ${mats.map((m) => m.label).join(" vs ")}`,
        `${mats.length} different materials are specified for the same component. Material specifications conflict.`,
        mats,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectSupplierContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const suppliers = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "SUPPLIER" || n.entityType === "MANUFACTURER",
  );

  const byEntity = new Map<string, Set<string>>();
  const supplierNodes = new Map<string, EvidenceNode>();
  for (const sup of suppliers) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === sup.id && e.relationType === "SUPPORTS",
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      if (!byEntity.has(target.entityId)) byEntity.set(target.entityId, new Set());
      byEntity.get(target.entityId)!.add(sup.id);
      supplierNodes.set(sup.id, sup);
    }
  }

  for (const [, supplierIds] of byEntity) {
    if (supplierIds.size < 2) continue;
    const nodes = Array.from(supplierIds).map((id) => supplierNodes.get(id)!);
    const ids = nodes.map((n) => n.id);
    const id = makeId("SUPPLIER_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "SUPPLIER_CONTRADICTION",
        "MEDIUM",
        `Multiple suppliers for entity: ${nodes.map((s) => s.label).join(", ")}`,
        `${supplierIds.size} different suppliers are associated with the same entity. This may indicate a supply chain conflict or dual-sourcing.`,
        nodes,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectInterfaceContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const interfaces = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "INTERFACE",
  );

  const byPair = new Map<string, EvidenceNode[]>();
  for (const iface of interfaces) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === iface.id && e.relationType === "REFERENCES",
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      const key = `${iface.entityId}-${target.entityId}`;
      if (!byPair.has(key)) byPair.set(key, []);
      byPair.get(key)!.push(iface);
    }
  }

  for (const [, ifaces] of byPair) {
    if (ifaces.length < 2) continue;
    const statuses = new Set(ifaces.map((i) => i.status));
    if (statuses.size <= 1) continue;

    const ids = ifaces.map((i) => i.id);
    const id = makeId("INTERFACE_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "INTERFACE_CONTRADICTION",
        "HIGH",
        `Incompatible interfaces: ${ifaces.map((i) => i.label).join(" vs ")}`,
        `${ifaces.length} interface definitions with different statuses exist between the same components. Interface definitions are incompatible.`,
        ifaces,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectVersionContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];

  for (const edge of graph.edges) {
    if (edge.relationType !== "SUPERSEDES") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;
    if (source.entityId === target.entityId) continue;

    const ids = [edge.sourceId, edge.targetId];
    const id = makeId("VERSION_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "VERSION_CONTRADICTION",
        "HIGH",
        `Version mismatch: ${target.label} superseded by ${source.label}`,
        `Entity "${target.label}" has been superseded by "${source.label}" but both are still referenced. Version mismatch detected.`,
        [source, target],
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectLifecycleContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];

  for (const edge of graph.edges) {
    if (edge.relationType !== "SUPPORTS" && edge.relationType !== "VERIFIES") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;

    if (source.status === "ACTIVE" && target.status === "SUPERSEDED") {
      const ids = [edge.sourceId, edge.targetId];
      const id = makeId("LIFECYCLE_CONTRADICTION", ids);
      if (seen.has(id)) continue;
      seen.add(id);

      results.push(
        makeContradiction(
          id,
          "LIFECYCLE_CONTRADICTION",
          "MEDIUM",
          `Lifecycle conflict: ${source.label} (Active) depends on ${target.label} (Superseded)`,
          `Active entity "${source.label}" depends on superseded entity "${target.label}". The dependency chain references outdated evidence.`,
          [source, target],
          graph.edges,
          graph,
          orgId,
          now,
        ),
      );
    }
  }

  return results;
}

function detectRelationshipContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const nodeIds = new Set(graph.nodes.keys());

  for (const edge of graph.edges) {
    if (nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)) continue;

    const missing: string[] = [];
    if (!nodeIds.has(edge.sourceId)) missing.push(edge.sourceId);
    if (!nodeIds.has(edge.targetId)) missing.push(edge.targetId);

    const id = makeId("RELATIONSHIP_CONTRADICTION", [edge.id, ...missing]);
    if (seen.has(id)) continue;
    seen.add(id);

    const presentNodes = missing
      .map((m) => graph.nodes.get(m))
      .filter((n): n is EvidenceNode => n !== undefined);

    results.push(
      makeContradiction(
        id,
        "RELATIONSHIP_CONTRADICTION",
        "HIGH",
        `Broken relationship: ${edge.id}`,
        `Relationship "${edge.id}" references node(s) not in the evidence graph: ${missing.join(", ")}. This indicates a broken reference or deleted entity.`,
        presentNodes.length > 0 ? presentNodes : Array.from(graph.nodes.values()).slice(0, 1),
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectCertificationContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const certs = Array.from(graph.nodes.values()).filter(
    (n) => n.entityType === "CERTIFICATION" || n.type === "CERTIFICATION",
  );

  const byEntity = new Map<string, EvidenceNode[]>();
  for (const cert of certs) {
    const edges = graph.edges.filter(
      (e) => e.sourceId === cert.id && e.relationType === "VERIFIES",
    );
    for (const edge of edges) {
      const target = graph.nodes.get(edge.targetId);
      if (!target?.entityId) continue;
      if (!byEntity.has(target.entityId)) byEntity.set(target.entityId, []);
      byEntity.get(target.entityId)!.push(cert);
    }
  }

  for (const [, certList] of byEntity) {
    if (certList.length < 2) continue;
    const statuses = new Set(certList.map((c) => c.status));
    if (statuses.size <= 1 && certList.every((c) => c.status === "ACTIVE")) continue;

    const ids = certList.map((c) => c.id);
    const id = makeId("CERTIFICATION_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "CERTIFICATION_CONTRADICTION",
        "HIGH",
        `Conflicting certifications: ${certList.map((c) => c.label).join(" vs ")}`,
        `${certList.length} certifications with different statuses (${Array.from(statuses).join(", ")}) verify the same entity. Certification requirements conflict.`,
        certList,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectDocumentContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const docs = Array.from(graph.nodes.values()).filter(
    (n) => n.type === "DOCUMENT" || n.type === "EXTRACTED_FACT",
  );

  const byEntity = new Map<string, EvidenceNode[]>();
  for (const doc of docs) {
    if (!doc.entityId) continue;
    if (!byEntity.has(doc.entityId)) byEntity.set(doc.entityId, []);
    byEntity.get(doc.entityId)!.push(doc);
  }

  for (const [, docList] of byEntity) {
    if (docList.length < 2) continue;
    const versions = docList.map((d) => d.documentVersion).filter((v): v is number => v !== undefined);
    if (versions.length === 0) continue;
    const maxVersion = Math.max(...versions);
    const hasOld = versions.some((v) => v < maxVersion);
    if (!hasOld) continue;

    const ids = docList.map((d) => d.id);
    const id = makeId("DOCUMENT_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "DOCUMENT_CONTRADICTION",
        "MEDIUM",
        `Document version conflict for entity`,
        `${docList.length} document references with different versions (max: v${maxVersion}) exist for the same entity. Outdated document versions may contain contradictory information.`,
        docList,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectEvidenceContradictions(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];

  for (const edge of graph.edges) {
    if (edge.relationType !== "CONTRADICTS") continue;
    const source = graph.nodes.get(edge.sourceId);
    const target = graph.nodes.get(edge.targetId);
    if (!source || !target) continue;

    const ids = [edge.sourceId, edge.targetId];
    const id = makeId("EVIDENCE_CONTRADICTION", ids);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "EVIDENCE_CONTRADICTION",
        "CRITICAL",
        `Evidence contradiction: ${source.label} contradicts ${target.label}`,
        `Evidence node "${source.label}" directly contradicts evidence node "${target.label}". These evidence statements cannot simultaneously be true.`,
        [source, target],
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectStaleEvidence(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];

  for (const node of graph.nodes.values()) {
    if (node.type !== "ENTITY") continue;
    if (!isStale(node.updatedAt)) continue;
    if (node.status === "ACTIVE" || node.status === "APPROVED") continue;

    const id = makeId("EVIDENCE_CONTRADICTION", ["stale", node.id]);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "EVIDENCE_CONTRADICTION",
        "MEDIUM",
        `Stale evidence: ${node.label}`,
        `Evidence "${node.label}" has not been updated in over ${STALE_THRESHOLD_DAYS} days and has status "${node.status}". This evidence may be outdated.`,
        [node],
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectBrokenReferences(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const nodeIds = new Set(graph.nodes.keys());

  for (const edge of graph.edges) {
    if (nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)) continue;

    const missing: string[] = [];
    if (!nodeIds.has(edge.sourceId)) missing.push(edge.sourceId);
    if (!nodeIds.has(edge.targetId)) missing.push(edge.targetId);

    const id = makeId("RELATIONSHIP_CONTRADICTION", ["broken", edge.id, ...missing]);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "RELATIONSHIP_CONTRADICTION",
        "HIGH",
        `Broken reference: ${edge.id}`,
        `Edge "${edge.id}" references node(s) not in the evidence graph: ${missing.join(", ")}. This may indicate deleted entities or corrupted relationships.`,
        Array.from(graph.nodes.values()).slice(0, 1),
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}

function detectDuplicateEntities(
  graph: EvidenceGraph,
  orgId: string,
  seen: Set<string>,
  now: string,
): ContradictionRecord[] {
  const results: ContradictionRecord[] = [];
  const byName = new Map<string, EvidenceNode[]>();

  for (const node of graph.nodes.values()) {
    if (node.type !== "ENTITY") continue;
    const key = `${node.entityType}:${node.label.toLowerCase()}`;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(node);
  }

  for (const [, nodes] of byName) {
    if (nodes.length < 2) continue;
    const ids = nodes.map((n) => n.id);
    const id = makeId("EVIDENCE_CONTRADICTION", ["duplicate", ...ids]);
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      makeContradiction(
        id,
        "EVIDENCE_CONTRADICTION",
        "MEDIUM",
        `Duplicate entities: ${nodes[0].label}`,
        `${nodes.length} entities share the same name and type. Possible duplicate evidence.`,
        nodes,
        graph.edges,
        graph,
        orgId,
        now,
      ),
    );
  }

  return results;
}
