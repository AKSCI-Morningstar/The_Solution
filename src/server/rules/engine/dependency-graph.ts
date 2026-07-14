export interface DependencyEdge {
  ruleId: string;
  dependsOnRuleId: string;
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  /** The rule ids forming the cycle, in order, if one was found. */
  cyclePath: string[];
}

/**
 * Detects whether the given dependency edges (ruleId depends on
 * dependsOnRuleId) contain a cycle, using iterative DFS with a recursion
 * stack. Deterministic and pure - takes the full edge list as input rather
 * than querying anything itself.
 */
export function detectCycle(edges: DependencyEdge[]): CycleDetectionResult {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    const list = graph.get(edge.ruleId) ?? [];
    list.push(edge.dependsOnRuleId);
    graph.set(edge.ruleId, list);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const pathStack: string[] = [];

  function visit(nodeId: string): string[] | null {
    if (inStack.has(nodeId)) {
      const cycleStart = pathStack.indexOf(nodeId);
      return [...pathStack.slice(cycleStart), nodeId];
    }
    if (visited.has(nodeId)) return null;

    visited.add(nodeId);
    inStack.add(nodeId);
    pathStack.push(nodeId);

    for (const next of graph.get(nodeId) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }

    inStack.delete(nodeId);
    pathStack.pop();
    return null;
  }

  const allNodes = new Set<string>();
  for (const edge of edges) {
    allNodes.add(edge.ruleId);
    allNodes.add(edge.dependsOnRuleId);
  }

  for (const node of allNodes) {
    if (visited.has(node)) continue;
    const cycle = visit(node);
    if (cycle) return { hasCycle: true, cyclePath: cycle };
  }

  return { hasCycle: false, cyclePath: [] };
}

export class CircularDependencyError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Circular rule dependency detected: ${cyclePath.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}

/**
 * Returns `ruleIds` ordered so every rule appears after everything it
 * depends on (Kahn's algorithm). Only edges relevant to `ruleIds` are
 * considered - a dependency outside the requested set is treated as already
 * satisfied (its own latest result, if any, is looked up separately by the
 * caller). Throws CircularDependencyError if `edges` contains a cycle among
 * `ruleIds`.
 */
export function topologicalOrder(ruleIds: string[], edges: DependencyEdge[]): string[] {
  const relevantIds = new Set(ruleIds);
  const relevantEdges = edges.filter(
    (edge) => relevantIds.has(edge.ruleId) && relevantIds.has(edge.dependsOnRuleId),
  );

  const cycle = detectCycle(relevantEdges);
  if (cycle.hasCycle) {
    throw new CircularDependencyError(cycle.cyclePath);
  }

  const inDegree = new Map<string, number>(ruleIds.map((id) => [id, 0]));
  const dependents = new Map<string, string[]>();

  for (const edge of relevantEdges) {
    // edge.ruleId depends on edge.dependsOnRuleId, so dependsOnRuleId must come first.
    inDegree.set(edge.ruleId, (inDegree.get(edge.ruleId) ?? 0) + 1);
    const list = dependents.get(edge.dependsOnRuleId) ?? [];
    list.push(edge.ruleId);
    dependents.set(edge.dependsOnRuleId, list);
  }

  const queue = ruleIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    ordered.push(current);
    for (const dependent of dependents.get(current) ?? []) {
      const remaining = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }

  return ordered;
}
