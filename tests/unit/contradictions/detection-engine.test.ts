import { describe, it, expect } from "vitest";
import { detectContradictions } from "@/server/contradictions/detection-engine";
import type { EvidenceGraph, EvidenceNode, EvidenceEdge } from "@/server/evidence/types";

function makeNode(overrides: Partial<EvidenceNode>): EvidenceNode {
  return {
    id: overrides.id ?? "node-1",
    type: overrides.type ?? "ENTITY",
    label: overrides.label ?? "Test Entity",
    entityId: overrides.entityId,
    entityType: overrides.entityType,
    status: overrides.status,
    version: overrides.version,
    documentId: overrides.documentId,
    documentName: overrides.documentName,
    documentVersion: overrides.documentVersion,
    page: overrides.page,
    section: overrides.section,
    extractionMethod: overrides.extractionMethod,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function makeGraph(nodes: EvidenceNode[], edges: EvidenceEdge[], rootId: string): EvidenceGraph {
  const nodeMap = new Map<string, EvidenceNode>();
  for (const node of nodes) nodeMap.set(node.id, node);
  return { nodes: nodeMap, edges, rootId };
}

const ORG_ID = "org-test";

describe("contradiction detection engine", () => {
  it("returns empty result for graph with no contradictions", () => {
    const nodes = [
      makeNode({ id: "a", label: "Entity A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    expect(result.contradictions).toEqual([]);
    expect(result.totalDetected).toBe(0);
  });

  it("detects requirement contradictions with conflicting statuses", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const req1 = makeNode({
      id: "req-1",
      label: "Req A",
      entityType: "REQUIREMENT",
      type: "REQUIREMENT",
      status: "ACTIVE",
      entityId: "req-ent-1",
    });
    const req2 = makeNode({
      id: "req-2",
      label: "Req B",
      entityType: "REQUIREMENT",
      type: "REQUIREMENT",
      status: "REJECTED",
      entityId: "req-ent-2",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "req-1", targetId: "target", relationType: "REFERENCES" },
      { id: "e2", sourceId: "req-2", targetId: "target", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([target, req1, req2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const reqConflicts = result.contradictions.filter(
      (c) => c.type === "REQUIREMENT_CONTRADICTION",
    );
    expect(reqConflicts).toHaveLength(1);
    expect(reqConflicts[0].severity).toBe("CRITICAL");
  });

  it("detects specification contradictions with different statuses", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const spec1 = makeNode({
      id: "spec-1",
      label: "Spec A",
      entityType: "SPECIFICATION",
      type: "SPECIFICATION",
      status: "ACTIVE",
      entityId: "spec-ent-1",
    });
    const spec2 = makeNode({
      id: "spec-2",
      label: "Spec B",
      entityType: "SPECIFICATION",
      type: "SPECIFICATION",
      status: "DRAFT",
      entityId: "spec-ent-2",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "spec-1", targetId: "target", relationType: "REFERENCES" },
      { id: "e2", sourceId: "spec-2", targetId: "target", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([target, spec1, spec2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const specConflicts = result.contradictions.filter(
      (c) => c.type === "SPECIFICATION_CONTRADICTION",
    );
    expect(specConflicts).toHaveLength(1);
    expect(specConflicts[0].severity).toBe("HIGH");
  });

  it("detects material contradictions for same component", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const mat1 = makeNode({
      id: "mat-1",
      label: "Aluminum",
      entityType: "MATERIAL",
      entityId: "mat-ent-1",
    });
    const mat2 = makeNode({
      id: "mat-2",
      label: "Steel",
      entityType: "MATERIAL",
      entityId: "mat-ent-2",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "mat-1", targetId: "target", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "mat-2", targetId: "target", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([target, mat1, mat2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const matConflicts = result.contradictions.filter((c) => c.type === "MATERIAL_CONTRADICTION");
    expect(matConflicts).toHaveLength(1);
  });

  it("detects supplier contradictions", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const sup1 = makeNode({
      id: "sup-1",
      label: "Supplier A",
      entityType: "SUPPLIER",
      entityId: "sup-ent-1",
    });
    const sup2 = makeNode({
      id: "sup-2",
      label: "Supplier B",
      entityType: "SUPPLIER",
      entityId: "sup-ent-2",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "sup-1", targetId: "target", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "sup-2", targetId: "target", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([target, sup1, sup2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const supConflicts = result.contradictions.filter((c) => c.type === "SUPPLIER_CONTRADICTION");
    expect(supConflicts).toHaveLength(1);
    expect(supConflicts[0].severity).toBe("MEDIUM");
  });

  it("detects version contradictions from SUPERSEDES edges", () => {
    const old = makeNode({
      id: "old",
      label: "Old Spec",
      entityType: "SPECIFICATION",
      status: "SUPERSEDED",
      entityId: "ent-old",
    });
    const newer = makeNode({
      id: "new",
      label: "New Spec",
      entityType: "SPECIFICATION",
      status: "ACTIVE",
      entityId: "ent-new",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "new", targetId: "old", relationType: "SUPERSEDES" },
    ];
    const graph = makeGraph([old, newer], edges, "old");
    const result = detectContradictions(graph, ORG_ID);
    const versionConflicts = result.contradictions.filter(
      (c) => c.type === "VERSION_CONTRADICTION",
    );
    expect(versionConflicts).toHaveLength(1);
    expect(versionConflicts[0].severity).toBe("HIGH");
  });

  it("detects lifecycle contradictions (active depends on superseded)", () => {
    const active = makeNode({
      id: "active",
      label: "Active Entity",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-active",
    });
    const superseded = makeNode({
      id: "super",
      label: "Old Entity",
      entityType: "COMPONENT",
      status: "SUPERSEDED",
      entityId: "ent-super",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "active", targetId: "super", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([active, superseded], edges, "active");
    const result = detectContradictions(graph, ORG_ID);
    const lifecycleConflicts = result.contradictions.filter(
      (c) => c.type === "LIFECYCLE_CONTRADICTION",
    );
    expect(lifecycleConflicts).toHaveLength(1);
    expect(lifecycleConflicts[0].severity).toBe("MEDIUM");
  });

  it("detects evidence contradictions from CONTRADICTS edges", () => {
    const a = makeNode({
      id: "a",
      label: "Evidence A",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-a",
    });
    const b = makeNode({
      id: "b",
      label: "Evidence B",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-b",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "b", relationType: "CONTRADICTS" },
    ];
    const graph = makeGraph([a, b], edges, "a");
    const result = detectContradictions(graph, ORG_ID);
    const evidenceConflicts = result.contradictions.filter(
      (c) => c.type === "EVIDENCE_CONTRADICTION",
    );
    expect(evidenceConflicts).toHaveLength(1);
    expect(evidenceConflicts[0].severity).toBe("CRITICAL");
  });

  it("detects certification contradictions", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const cert1 = makeNode({
      id: "cert-1",
      label: "Cert A",
      entityType: "CERTIFICATION",
      type: "CERTIFICATION",
      status: "ACTIVE",
      entityId: "cert-ent-1",
    });
    const cert2 = makeNode({
      id: "cert-2",
      label: "Cert B",
      entityType: "CERTIFICATION",
      type: "CERTIFICATION",
      status: "EXPIRED",
      entityId: "cert-ent-2",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "cert-1", targetId: "target", relationType: "VERIFIES" },
      { id: "e2", sourceId: "cert-2", targetId: "target", relationType: "VERIFIES" },
    ];
    const graph = makeGraph([target, cert1, cert2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const certConflicts = result.contradictions.filter(
      (c) => c.type === "CERTIFICATION_CONTRADICTION",
    );
    expect(certConflicts).toHaveLength(1);
  });

  it("detects document contradictions with different versions", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const doc1 = makeNode({
      id: "doc-1",
      label: "Spec Doc",
      type: "EXTRACTED_FACT",
      entityId: "ent-1",
      documentId: "d1",
      documentName: "spec.pdf",
      documentVersion: 1,
    });
    const doc2 = makeNode({
      id: "doc-2",
      label: "Spec Doc v2",
      type: "EXTRACTED_FACT",
      entityId: "ent-1",
      documentId: "d2",
      documentName: "spec.pdf",
      documentVersion: 2,
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "doc-1", targetId: "target", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "doc-2", targetId: "target", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([target, doc1, doc2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const docConflicts = result.contradictions.filter((c) => c.type === "DOCUMENT_CONTRADICTION");
    expect(docConflicts).toHaveLength(1);
  });

  it("detects duplicate entities", () => {
    const nodes = [
      makeNode({ id: "a", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
      makeNode({ id: "b", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    const dupConflicts = result.contradictions.filter((c) => c.label.includes("Duplicate"));
    expect(dupConflicts).toHaveLength(1);
  });

  it("detects stale evidence", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 400);
    const nodes = [
      makeNode({
        id: "a",
        label: "Old Entity",
        entityType: "COMPONENT",
        status: "DRAFT",
        updatedAt: oldDate.toISOString(),
      }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    const staleConflicts = result.contradictions.filter((c) => c.label.includes("Stale"));
    expect(staleConflicts).toHaveLength(1);
  });

  it("does not flag active entities as stale", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 400);
    const nodes = [
      makeNode({
        id: "a",
        label: "Old Active Entity",
        entityType: "COMPONENT",
        status: "ACTIVE",
        updatedAt: oldDate.toISOString(),
      }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    const staleConflicts = result.contradictions.filter((c) => c.label.includes("Stale"));
    expect(staleConflicts).toEqual([]);
  });

  it("detects broken references in edges", () => {
    const nodes = [
      makeNode({ id: "a", label: "Entity A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "missing", relationType: "REFERENCES" },
    ];
    const graph = makeGraph(nodes, edges, "a");
    const result = detectContradictions(graph, ORG_ID);
    const brokenConflicts = result.contradictions.filter((c) => c.label.includes("Broken"));
    expect(brokenConflicts.length).toBeGreaterThanOrEqual(1);
  });

  it("detects interface contradictions with different statuses", () => {
    const target = makeNode({
      id: "target",
      label: "Component",
      entityType: "COMPONENT",
      entityId: "ent-1",
      status: "ACTIVE",
    });
    const iface1 = makeNode({
      id: "iface-1",
      label: "Interface A",
      entityType: "INTERFACE",
      status: "ACTIVE",
      entityId: "iface-ent",
    });
    const iface2 = makeNode({
      id: "iface-2",
      label: "Interface B",
      entityType: "INTERFACE",
      status: "DRAFT",
      entityId: "iface-ent",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "iface-1", targetId: "target", relationType: "REFERENCES" },
      { id: "e2", sourceId: "iface-2", targetId: "target", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([target, iface1, iface2], edges, "target");
    const result = detectContradictions(graph, ORG_ID);
    const ifaceConflicts = result.contradictions.filter(
      (c) => c.type === "INTERFACE_CONTRADICTION",
    );
    expect(ifaceConflicts).toHaveLength(1);
  });

  it("includes traceability chain in contradiction records", () => {
    const a = makeNode({
      id: "a",
      label: "Evidence A",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-a",
    });
    const b = makeNode({
      id: "b",
      label: "Evidence B",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-b",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "b", relationType: "CONTRADICTS" },
    ];
    const graph = makeGraph([a, b], edges, "a");
    const result = detectContradictions(graph, ORG_ID);
    expect(result.contradictions.length).toBeGreaterThan(0);
    const contradiction = result.contradictions[0];
    expect(contradiction.traceabilityChain).toBeDefined();
    expect(contradiction.traceabilityChain.length).toBeGreaterThan(0);
  });

  it("includes affected entities in contradiction records", () => {
    const a = makeNode({
      id: "a",
      label: "Evidence A",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-a",
    });
    const b = makeNode({
      id: "b",
      label: "Evidence B",
      entityType: "COMPONENT",
      status: "ACTIVE",
      entityId: "ent-b",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "b", relationType: "CONTRADICTS" },
    ];
    const graph = makeGraph([a, b], edges, "a");
    const result = detectContradictions(graph, ORG_ID);
    const contradiction = result.contradictions.find((c) => c.type === "EVIDENCE_CONTRADICTION");
    expect(contradiction).toBeDefined();
    expect(contradiction!.affectedEntities.length).toBeGreaterThan(0);
  });

  it("sets organization ID on all contradiction records", () => {
    const nodes = [
      makeNode({ id: "a", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
      makeNode({ id: "b", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    expect(result.contradictions.every((c) => c.organizationId === ORG_ID)).toBe(true);
  });

  it("sets detectedAt timestamp on all records", () => {
    const nodes = [
      makeNode({ id: "a", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
      makeNode({ id: "b", label: "Pump A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    expect(result.contradictions.every((c) => c.detectedAt)).toBe(true);
    expect(result.detectedAt).toBeDefined();
  });

  it("counts insufficient evidence contradictions", () => {
    const nodes = [
      makeNode({ id: "a", label: "Entity A", entityType: "COMPONENT", status: "ACTIVE" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const result = detectContradictions(graph, ORG_ID);
    expect(result.insufficientEvidenceCount).toBe(
      result.contradictions.filter((c) => c.severity === "BLOCKED_BY_MISSING_EVIDENCE").length,
    );
  });
});
