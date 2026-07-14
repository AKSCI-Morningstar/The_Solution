import { describe, it, expect } from "vitest";
import { detectConflicts } from "@/server/evidence/conflict-detector";
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
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function makeGraph(nodes: EvidenceNode[], edges: EvidenceEdge[], rootId: string): EvidenceGraph {
  const nodeMap = new Map<string, EvidenceNode>();
  for (const node of nodes) nodeMap.set(node.id, node);
  return { nodes: nodeMap, edges, rootId };
}

describe("conflict-detector", () => {
  it("returns empty array for graph with no conflicts", () => {
    const nodes = [makeNode({ id: "a", label: "Entity A", entityType: "COMPONENT" })];
    const graph = makeGraph(nodes, [], "a");
    const conflicts = detectConflicts(graph);
    expect(conflicts).toEqual([]);
  });

  it("detects duplicate entities with same name and type", () => {
    const nodes = [
      makeNode({ id: "a", label: "Pump A", entityType: "COMPONENT" }),
      makeNode({ id: "b", label: "Pump A", entityType: "COMPONENT" }),
    ];
    const graph = makeGraph(nodes, [], "a");
    const conflicts = detectConflicts(graph);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("DUPLICATE_EVIDENCE");
    expect(conflicts[0].severity).toBe("MEDIUM");
  });

  it("detects superseded evidence", () => {
    const nodes = [
      makeNode({ id: "a", label: "Old Spec", entityType: "SPECIFICATION", status: "SUPERSEDED" }),
      makeNode({ id: "b", label: "New Spec", entityType: "SPECIFICATION", status: "ACTIVE" }),
    ];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "b", targetId: "a", relationType: "SUPERSEDES" },
    ];
    const graph = makeGraph(nodes, edges, "a");
    const conflicts = detectConflicts(graph);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("OUTDATED_EVIDENCE");
    expect(conflicts[0].severity).toBe("HIGH");
  });

  it("detects stale evidence older than threshold", () => {
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
    const conflicts = detectConflicts(graph);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("OUTDATED_EVIDENCE");
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
    const conflicts = detectConflicts(graph);
    expect(conflicts).toEqual([]);
  });

  it("detects broken references to missing nodes", () => {
    const nodes = [makeNode({ id: "a", label: "Entity A", entityType: "COMPONENT" })];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "missing-node", relationType: "REFERENCES" },
    ];
    const graph = makeGraph(nodes, edges, "a");
    const conflicts = detectConflicts(graph);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("BROKEN_REFERENCE");
    expect(conflicts[0].severity).toBe("HIGH");
  });

  it("detects conflicting suppliers for same entity", () => {
    const nodes = [
      makeNode({ id: "target", label: "Component", entityType: "COMPONENT", entityId: "ent-1" }),
      makeNode({ id: "s1", label: "Supplier A", entityType: "SUPPLIER" }),
      makeNode({ id: "s2", label: "Supplier B", entityType: "SUPPLIER" }),
    ];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "s1", targetId: "target", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "s2", targetId: "target", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph(nodes, edges, "target");
    const conflicts = detectConflicts(graph);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("CONFLICTING_SUPPLIER");
  });

  it("detects conflicting specifications with different statuses", () => {
    const nodes = [
      makeNode({ id: "target", label: "Component", entityType: "COMPONENT", entityId: "ent-1" }),
      makeNode({
        id: "spec1",
        label: "Spec A",
        entityType: "SPECIFICATION",
        type: "SPECIFICATION",
        status: "ACTIVE",
      }),
      makeNode({
        id: "spec2",
        label: "Spec B",
        entityType: "SPECIFICATION",
        type: "SPECIFICATION",
        status: "DRAFT",
      }),
    ];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "spec1", targetId: "target", relationType: "REFERENCES" },
      { id: "e2", sourceId: "spec2", targetId: "target", relationType: "REFERENCES" },
    ];
    const graph = makeGraph(nodes, edges, "target");
    const conflicts = detectConflicts(graph);
    const specConflicts = conflicts.filter((c) => c.type === "CONFLICTING_SPECIFICATION");
    expect(specConflicts).toHaveLength(1);
    expect(specConflicts[0].severity).toBe("HIGH");
  });

  it("does not flag specifications with same status as conflicting", () => {
    const nodes = [
      makeNode({ id: "target", label: "Component", entityType: "COMPONENT", entityId: "ent-1" }),
      makeNode({
        id: "spec1",
        label: "Spec A",
        type: "SPECIFICATION",
        entityType: "SPECIFICATION",
        status: "ACTIVE",
      }),
      makeNode({
        id: "spec2",
        label: "Spec B",
        type: "SPECIFICATION",
        entityType: "SPECIFICATION",
        status: "ACTIVE",
      }),
    ];
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "spec1", targetId: "target", relationType: "REFERENCES" },
      { id: "e2", sourceId: "spec2", targetId: "target", relationType: "REFERENCES" },
    ];
    const graph = makeGraph(nodes, edges, "target");
    const conflicts = detectConflicts(graph);
    const specConflicts = conflicts.filter((c) => c.type === "CONFLICTING_SPECIFICATION");
    expect(specConflicts).toEqual([]);
  });
});
