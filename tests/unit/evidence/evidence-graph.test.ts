import { describe, it, expect } from "vitest";
import type { EvidenceGraph, EvidenceNode, EvidenceEdge } from "@/server/evidence/types";
import { getSupportingNodes, getConflictingNodes } from "@/server/evidence/evidence-graph";

function makeNode(overrides: Partial<EvidenceNode>): EvidenceNode {
  return {
    id: overrides.id ?? "root",
    type: overrides.type ?? "ENTITY",
    label: overrides.label ?? "Test",
    entityId: overrides.entityId,
    entityType: overrides.entityType,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function makeGraph(nodes: EvidenceNode[], edges: EvidenceEdge[], rootId: string): EvidenceGraph {
  const nodeMap = new Map<string, EvidenceNode>();
  for (const node of nodes) nodeMap.set(node.id, node);
  return { nodes: nodeMap, edges, rootId };
}

describe("evidence-graph helpers", () => {
  it("getSupportingNodes returns nodes with SUPPORTS relation targeting root", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const support = makeNode({ id: "s1", label: "Support" });
    const other = makeNode({ id: "o1", label: "Other" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "s1", targetId: "root", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "o1", targetId: "root", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([root, support, other], edges, "root");
    const supporting = getSupportingNodes(graph, "root");
    expect(supporting).toHaveLength(1);
    expect(supporting[0].id).toBe("s1");
  });

  it("getSupportingNodes returns nodes that root VERIFIES", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const verified = makeNode({ id: "v1", label: "Verified" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "root", targetId: "v1", relationType: "VERIFIES" },
    ];
    const graph = makeGraph([root, verified], edges, "root");
    const supporting = getSupportingNodes(graph, "root");
    expect(supporting).toHaveLength(1);
    expect(supporting[0].id).toBe("v1");
  });

  it("getConflictingNodes returns nodes with CONTRADICTS relation", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const contra = makeNode({ id: "c1", label: "Contradicts" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "c1", targetId: "root", relationType: "CONTRADICTS" },
    ];
    const graph = makeGraph([root, contra], edges, "root");
    const conflicting = getConflictingNodes(graph, "root");
    expect(conflicting).toHaveLength(1);
    expect(conflicting[0].id).toBe("c1");
  });

  it("getConflictingNodes returns empty for no contradictions", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const support = makeNode({ id: "s1", label: "Support" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "s1", targetId: "root", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([root, support], edges, "root");
    const conflicting = getConflictingNodes(graph, "root");
    expect(conflicting).toEqual([]);
  });
});
