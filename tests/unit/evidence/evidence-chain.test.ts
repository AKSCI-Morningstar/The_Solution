import { describe, it, expect } from "vitest";
import { buildEvidenceChains } from "@/server/evidence/evidence-chain";
import type { EvidenceGraph, EvidenceNode, EvidenceEdge } from "@/server/evidence/types";

function makeNode(overrides: Partial<EvidenceNode>): EvidenceNode {
  return {
    id: overrides.id ?? "root",
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
    confidence: overrides.confidence,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function makeGraph(nodes: EvidenceNode[], edges: EvidenceEdge[], rootId: string): EvidenceGraph {
  const nodeMap = new Map<string, EvidenceNode>();
  for (const node of nodes) nodeMap.set(node.id, node);
  return { nodes: nodeMap, edges, rootId };
}

describe("evidence-chain", () => {
  it("returns empty array for graph with no incoming edges", () => {
    const root = makeNode({ id: "root", label: "Root Entity" });
    const graph = makeGraph([root], [], "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toEqual([]);
  });

  it("builds a single-depth chain from one supporting node", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const support = makeNode({ id: "support-1", label: "Supporting Evidence" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "support-1", targetId: "root", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([root, support], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toHaveLength(1);
    expect(chains[0].links).toHaveLength(1);
    expect(chains[0].links[0].node.label).toBe("Supporting Evidence");
    expect(chains[0].links[0].relationType).toBe("SUPPORTS");
    expect(chains[0].totalDepth).toBe(1);
  });

  it("builds multi-depth chains", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const mid = makeNode({ id: "mid", label: "Mid" });
    const leaf = makeNode({ id: "leaf", label: "Leaf" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "mid", targetId: "root", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "leaf", targetId: "mid", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([root, mid, leaf], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toHaveLength(1);
    expect(chains[0].links).toHaveLength(2);
    expect(chains[0].links[0].node.label).toBe("Mid");
    expect(chains[0].links[1].node.label).toBe("Leaf");
    expect(chains[0].totalDepth).toBe(2);
  });

  it("builds multiple chains from branching evidence", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const a = makeNode({ id: "a", label: "A" });
    const b = makeNode({ id: "b", label: "B" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "root", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "b", targetId: "root", relationType: "VERIFIES" },
    ];
    const graph = makeGraph([root, a, b], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toHaveLength(2);
  });

  it("respects maxDepth limit", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const mid = makeNode({ id: "mid", label: "Mid" });
    const leaf = makeNode({ id: "leaf", label: "Leaf" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "mid", targetId: "root", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "leaf", targetId: "mid", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([root, mid, leaf], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 1);
    expect(chains).toHaveLength(1);
    expect(chains[0].links).toHaveLength(1);
  });

  it("handles cycles without infinite loops", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const a = makeNode({ id: "a", label: "A" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "a", targetId: "root", relationType: "SUPPORTS" },
      { id: "e2", sourceId: "root", targetId: "a", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([root, a], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toHaveLength(1);
    expect(chains[0].links).toHaveLength(1);
  });

  it("preserves source references in chain links", () => {
    const root = makeNode({ id: "root", label: "Root" });
    const doc = makeNode({
      id: "doc-1",
      label: "Document Evidence",
      type: "EXTRACTED_FACT",
      documentId: "d1",
      documentName: "spec.pdf",
      documentVersion: 2,
      page: 5,
      section: "3.1",
      extractionMethod: "pdf-parser",
    });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "doc-1", targetId: "root", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([root, doc], edges, "root");
    const chains = buildEvidenceChains(graph, "root", 5);
    expect(chains).toHaveLength(1);
    expect(chains[0].links[0].sourceReferences).toHaveLength(1);
    expect(chains[0].links[0].sourceReferences[0].documentName).toBe("spec.pdf");
    expect(chains[0].links[0].sourceReferences[0].page).toBe(5);
    expect(chains[0].links[0].sourceReferences[0].section).toBe("3.1");
  });
});
