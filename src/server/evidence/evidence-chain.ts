import type { EvidenceGraph, EvidenceNode, EvidenceChain, EvidenceChainLink, SourceReference } from "./types";
import type { EvidenceRelationType } from "./constants";

export function buildEvidenceChains(
  graph: EvidenceGraph,
  rootId: string,
  maxDepth: number,
): EvidenceChain[] {
  const chains: EvidenceChain[] = [];

  function dfs(
    currentId: string,
    links: EvidenceChainLink[],
    depth: number,
    pathVisited: Set<string>,
  ): void {
    if (depth > maxDepth) return;
    if (pathVisited.has(currentId)) return;
    pathVisited.add(currentId);

    const node = graph.nodes.get(currentId);
    if (!node) return;

    const incomingEdges = graph.edges.filter((e) => e.targetId === currentId);

    if (incomingEdges.length === 0 && links.length > 0) {
      chains.push({
        rootId,
        links: [...links],
        totalDepth: links.length,
      });
      return;
    }

    let hasOutgoing = false;
    for (const edge of incomingEdges) {
      if (pathVisited.has(edge.sourceId)) continue;
      if (depth + 1 > maxDepth) {
        if (links.length > 0) {
          chains.push({ rootId, links: [...links], totalDepth: links.length });
        }
        return;
      }
      hasOutgoing = true;
      const sourceNode = graph.nodes.get(edge.sourceId);
      if (!sourceNode) continue;

      const link: EvidenceChainLink = {
        nodeId: edge.sourceId,
        node: sourceNode,
        relationType: edge.relationType,
        sourceReferences: extractSourceReferences(sourceNode),
        depth,
      };

      dfs(edge.sourceId, [...links, link], depth + 1, new Set(pathVisited));
    }

    if (!hasOutgoing && links.length > 0) {
      chains.push({
        rootId,
        links: [...links],
        totalDepth: links.length,
      });
    }
  }

  dfs(rootId, [], 0, new Set());

  return chains.sort((a, b) => b.totalDepth - a.totalDepth);
}

function extractSourceReferences(node: EvidenceNode): SourceReference[] {
  const refs: SourceReference[] = [];
  if (node.documentId && node.documentName) {
    refs.push({
      documentId: node.documentId,
      documentName: node.documentName,
      documentVersion: node.documentVersion ?? 1,
      page: node.page,
      section: node.section,
      extractionMethod: node.extractionMethod,
    });
  }
  return refs;
}

export function getChainRelations(
  _graph: EvidenceGraph,
  chain: EvidenceChain,
): EvidenceRelationType[] {
  return chain.links.map((link) => link.relationType);
}
