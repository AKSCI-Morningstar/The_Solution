"use client";

import { FlaskConical } from "lucide-react";
import { CapabilityHub } from "@/components/layout/capability-hub";

export default function SimulationPage() {
  return (
    <CapabilityHub
      title="Simulation"
      description="Simulation scenarios reuse the deterministic Reality Engine and Reasoning Orchestrator pipelines. Use the operational modules below to evaluate engineering truth under controlled runs."
      status="integrated"
      statusLabel="Integrated via Reality & Orchestrator"
      icon={FlaskConical}
      links={[
        {
          label: "Reality Engine",
          href: "/reality",
          description: "Run evidence-backed reality assessments against engineering subjects.",
        },
        {
          label: "Reasoning Orchestrator",
          href: "/orchestrator",
          description: "Execute multi-stage reasoning pipelines with full run logs.",
        },
        {
          label: "Rules",
          href: "/rules",
          description: "Author and execute deterministic engineering rules.",
        },
        {
          label: "Evidence",
          href: "/evidence",
          description: "Inspect evidence chains feeding simulation-quality assessments.",
        },
      ]}
      notes={[
        "Dedicated discrete-event scenario authoring remains on the product roadmap.",
        "Current production path: Orchestrator run → Reality assessment → Report export.",
      ]}
    />
  );
}
