import { buildEvidenceGraph, detectConflicts, detectMissingEvidence } from "@/server/evidence";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 5 - builds the subject entity's evidence graph and resolves
 * conflicting/missing evidence. This is the stage that determines whether
 * the pipeline can proceed at all: an evidence graph with no nodes beyond
 * the root (no supporting relationships, documents, or requirements) means
 * there is nothing to reason about, and the pipeline short-circuits straight
 * to INSUFFICIENT_EVIDENCE - stages 6-8 are condition-gated on
 * `hasSupportingEvidence` in the pipeline wiring, not re-checked here.
 */
export const resolveSupportingEvidenceStage: WorkflowStage<PipelineContext> = {
  name: "RESOLVE_SUPPORTING_EVIDENCE",
  execute: async (ctx) => {
    const graph = await buildEvidenceGraph(ctx.organizationId, ctx.subjectEntityId, ctx.maxDepth);
    const conflicts = detectConflicts(graph);
    const missing = detectMissingEvidence(graph);

    const evidenceGraphSize = graph.nodes.size;
    const supportingEvidenceCount = Math.max(0, evidenceGraphSize - 1);

    return {
      patch: {
        evidenceGraphSize,
        supportingEvidenceCount,
        missingEvidence: missing.map((m) => `${m.label}: ${m.description}`),
        conflictingEvidence: conflicts.map((c) => ({
          type: c.type,
          label: c.label,
          description: c.description,
        })),
      },
      output: {
        evidenceGraphSize,
        supportingEvidenceCount,
        missingEvidenceCount: missing.length,
        conflictCount: conflicts.length,
      },
    };
  },
};
