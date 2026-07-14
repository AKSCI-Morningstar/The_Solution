import { describe, it, expect } from "vitest";
import { detectMissingEvidence } from "@/server/evidence/missing-evidence-detector";
import type { EvidenceGraph, EvidenceNode, EvidenceEdge } from "@/server/evidence/types";

function makeNode(overrides: Partial<EvidenceNode>): EvidenceNode {
  return {
    id: overrides.id ?? "root",
    type: overrides.type ?? "ENTITY",
    label: overrides.label ?? "Test Entity",
    entityId: overrides.entityId ?? "ent-1",
    entityType: overrides.entityType ?? "COMPONENT",
    status: overrides.status ?? "ACTIVE",
    version: overrides.version ?? "1.0.0",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function makeGraph(nodes: EvidenceNode[], edges: EvidenceEdge[], rootId: string): EvidenceGraph {
  const nodeMap = new Map<string, EvidenceNode>();
  for (const node of nodes) nodeMap.set(node.id, node);
  return { nodes: nodeMap, edges, rootId };
}

describe("missing-evidence-detector", () => {
  it("detects missing tests for COMPONENT entity", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingTests = missing.filter((m) => m.type === "MISSING_TEST");
    expect(missingTests).toHaveLength(1);
    expect(missingTests[0].severity).toBe("HIGH");
  });

  it("does not detect missing tests when VERIFIES relationship exists", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const testNode = makeNode({ id: "test-1", entityType: "TEST", label: "Test 1" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "test-1", targetId: "root", relationType: "VERIFIES" },
    ];
    const graph = makeGraph([root, testNode], edges, "root");
    const missing = detectMissingEvidence(graph);
    const missingTests = missing.filter((m) => m.type === "MISSING_TEST");
    expect(missingTests).toEqual([]);
  });

  it("detects missing certification for MATERIAL entity", () => {
    const root = makeNode({ id: "root", entityType: "MATERIAL" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingCert = missing.filter((m) => m.type === "MISSING_CERTIFICATION");
    expect(missingCert).toHaveLength(1);
    expect(missingCert[0].severity).toBe("HIGH");
  });

  it("detects missing specification for SYSTEM entity", () => {
    const root = makeNode({ id: "root", entityType: "SYSTEM" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingSpec = missing.filter((m) => m.type === "MISSING_SPECIFICATION");
    expect(missingSpec).toHaveLength(1);
  });

  it("detects missing approval for REQUIREMENT with DRAFT status", () => {
    const root = makeNode({ id: "root", entityType: "REQUIREMENT", status: "DRAFT" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingApproval = missing.filter((m) => m.type === "MISSING_APPROVAL");
    expect(missingApproval).toHaveLength(1);
  });

  it("does not detect missing approval for APPROVED requirement", () => {
    const root = makeNode({ id: "root", entityType: "REQUIREMENT", status: "APPROVED" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingApproval = missing.filter((m) => m.type === "MISSING_APPROVAL");
    expect(missingApproval).toEqual([]);
  });

  it("detects missing traceability when no incoming edges", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingTrace = missing.filter((m) => m.type === "MISSING_TRACEABILITY");
    expect(missingTrace).toHaveLength(1);
    expect(missingTrace[0].severity).toBe("HIGH");
  });

  it("does not detect missing traceability when incoming edges exist", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const other = makeNode({ id: "other", entityType: "SPECIFICATION", label: "Spec" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "other", targetId: "root", relationType: "REFERENCES" },
    ];
    const graph = makeGraph([root, other], edges, "root");
    const missing = detectMissingEvidence(graph);
    const missingTrace = missing.filter((m) => m.type === "MISSING_TRACEABILITY");
    expect(missingTrace).toEqual([]);
  });

  it("detects missing document references", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    const missingRef = missing.filter((m) => m.type === "MISSING_REFERENCE");
    expect(missingRef).toHaveLength(1);
  });

  it("does not detect missing references when document nodes exist", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT" });
    const doc = makeNode({ id: "doc-1", type: "DOCUMENT", label: "Doc 1", documentId: "d1" });
    const edges: EvidenceEdge[] = [
      { id: "e1", sourceId: "doc-1", targetId: "root", relationType: "SUPPORTS" },
    ];
    const graph = makeGraph([root, doc], edges, "root");
    const missing = detectMissingEvidence(graph);
    const missingRef = missing.filter((m) => m.type === "MISSING_REFERENCE");
    expect(missingRef).toEqual([]);
  });

  it("detects multiple missing evidence types for unconnected COMPONENT", () => {
    const root = makeNode({ id: "root", entityType: "COMPONENT", status: "DRAFT" });
    const graph = makeGraph([root], [], "root");
    const missing = detectMissingEvidence(graph);
    expect(missing.length).toBeGreaterThanOrEqual(4);
    const types = missing.map((m) => m.type);
    expect(types).toContain("MISSING_TEST");
    expect(types).toContain("MISSING_CERTIFICATION");
    expect(types).toContain("MISSING_SPECIFICATION");
    expect(types).toContain("MISSING_TRACEABILITY");
    expect(types).toContain("MISSING_REFERENCE");
  });
});
