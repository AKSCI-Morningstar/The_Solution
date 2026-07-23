/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db";

export interface GraphNode {
  id: string;
  type: "part" | "supplier" | "failure" | "decision" | "assessment";
  label: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: "supplied_by" | "caused_by" | "informs" | "depends_on" | "assesses";
  confidence: number;
}

export interface LineageGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getRecordLineage(
  recordId: string,
  organizationId: string,
): Promise<LineageGraph> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visitedNodeIds = new Set<string>();

  function addNode(node: GraphNode) {
    if (!visitedNodeIds.has(node.id)) {
      visitedNodeIds.add(node.id);
      nodes.push(node);
    }
  }

  // 1. Check if recordId is an Assessment
  const assessment = await prisma.drawingAssessment.findUnique({
    where: { id: recordId },
    include: { project: true },
  });

  if (assessment) {
    addNode({
      id: assessment.id,
      type: "assessment",
      label: assessment.title,
      metadata: {
        status: assessment.status,
        severity: assessment.severity,
        version: assessment.version,
      },
    });

    if (assessment.project) {
      addNode({
        id: assessment.project.id,
        type: "part",
        label: assessment.project.name,
        metadata: { description: assessment.project.description },
      });

      edges.push({
        source: assessment.id,
        target: assessment.project.id,
        relationship: "assesses",
        confidence: 0.98,
      });
    }
  }

  // 2. Fetch Decisions in Organization
  const decisions: any[] = await prisma.engineeringDecision.findMany({
    where: { organizationId },
    include: { milestones: true },
  });

  for (const decision of decisions) {
    if (
      decision.id === recordId ||
      visitedNodeIds.has(decision.id) ||
      (assessment && decision.drawingId === assessment.projectId)
    ) {
      addNode({
        id: decision.id,
        type: "decision",
        label: decision.title || "Engineering Decision",
        metadata: {
          category: decision.category || "DESIGN",
          impactLevel: decision.impactLevel || "MEDIUM",
        },
      });

      if (decision.drawingId) {
        edges.push({
          source: decision.id,
          target: decision.drawingId,
          relationship: "informs",
          confidence: 0.92,
        });
      }
    }
  }

  // 3. Fetch Suppliers
  const suppliers: any[] = await prisma.supplier.findMany({
    where: { organizationId },
    take: 5,
  });

  for (const supp of suppliers) {
    addNode({
      id: supp.id,
      type: "supplier",
      label: supp.name,
      metadata: { code: supp.code || "SUP-01", riskScore: supp.riskScore || 85 },
    });
  }

  // Connect supplier to first part node if present
  const firstPart = nodes.find((n) => n.type === "part");
  const firstSupplier = nodes.find((n) => n.type === "supplier");
  if (firstPart && firstSupplier) {
    edges.push({
      source: firstPart.id,
      target: firstSupplier.id,
      relationship: "supplied_by",
      confidence: 0.95,
    });
  }

  // Add dummy failure node for evidence chain demo
  const failureNodeId = `failure-${recordId.slice(0, 6)}`;
  addNode({
    id: failureNodeId,
    type: "failure",
    label: "Bore Concentricity Runout Out-of-Spec",
    metadata: { severity: "HIGH", frequency: "2/100" },
  });

  if (firstPart) {
    edges.push({
      source: failureNodeId,
      target: firstPart.id,
      relationship: "caused_by",
      confidence: 0.89,
    });
  }

  return { nodes, edges };
}
