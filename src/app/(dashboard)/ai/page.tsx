"use client";

import { Brain } from "lucide-react";
import { CapabilityHub } from "@/components/layout/capability-hub";

export default function AiWorkspacePage() {
  return (
    <CapabilityHub
      title="AI Workspace"
      description="Deterministic intelligence on this platform is delivered through search, knowledge graph exploration, contradiction detection, and reasoning orchestration—not free-form generation."
      status="integrated"
      statusLabel="Deterministic intelligence surface"
      icon={Brain}
      links={[
        {
          label: "Workspace Search",
          href: "/search",
          description: "Cross-entity search with command palette access (⌘K).",
        },
        {
          label: "Knowledge Graph",
          href: "/knowledge-graph",
          description: "Navigate provenanced engineering relationships visually.",
        },
        {
          label: "Contradictions",
          href: "/contradictions",
          description: "Detect and resolve conflicting engineering assertions.",
        },
        {
          label: "Orchestrator",
          href: "/orchestrator",
          description: "Run structured multi-stage reasoning with explainable logs.",
        },
      ]}
      notes={[
        "Generative AI chat is intentionally deferred to preserve deterministic engineering principles.",
        "Existing engines already provide evidence-backed recommendations and assessments.",
      ]}
    />
  );
}
