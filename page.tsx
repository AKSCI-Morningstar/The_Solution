'use client';

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Lock,
  FileText,
  Activity,
  Terminal,
  Compass,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Menu,
  X,
  Info,
  Sliders,
  Database,
  Scale,
  Network,
  ArrowUpRight,
  Filter
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Data Models
// ---------------------------------------------------------------------------

type NodeStatus = 'neutral' | 'dependency' | 'risk' | 'failure';

interface HeroGraphNode {
  id: string;
  code: string;
  label: string;
  sublabel: string;
  status: NodeStatus;
  x: number;
  y: number;
  isMainChain: boolean;
  timestamp: string;
  actor: string;
  system: string;
  summary: string;
}

interface HeroGraphEdge {
  from: string;
  to: string;
  isCriticalPath: boolean;
}

interface AlphaEvent {
  id: string;
  stepNumber: number;
  code: string;
  title: string;
  shortTitle: string;
  category: 'Decision' | 'Workflow' | 'Event' | 'Outcome';
  status: NodeStatus;
  isRootCauseChain: boolean;
  timestamp: string;
  responsibleRole: string;
  deviceContext: 'Desktop Workstation' | 'iPad Pro' | 'Smartphone' | 'Enterprise Laptop';
  sourceSystem: string;
  description: string;
  relatedItem: string;
  dependencies: string[];
  recordedEvidence: {
    factType: string;
    logId: string;
    verbatimRecord: string;
    verificationStatus: 'Verified System Record' | 'Authorized Event Log';
  };
  inferredExplanation: {
    confidenceNote: string;
    causalNote: string;
  };
  downstreamEffects: string[];
}

interface StakeholderUseCase {
  id: string;
  role: string;
  headline: string;
  description: string;
  keyQuestionsAnswered: string[];
  authorizedSources: string[];
  accessScope: string;
}

// ---------------------------------------------------------------------------
// Constants & Realistic Illustrative Data
// ---------------------------------------------------------------------------

const HERO_NODES: HeroGraphNode[] = [
  {
    id: 'h-dec-01',
    code: 'DEC-01',
    label: 'Decision 01',
    sublabel: 'Core Architecture & Scope Baseline',
    status: 'neutral',
    x: 70,
    y: 150,
    isMainChain: true,
    timestamp: 'Oct 02, 09:15 UTC',
    actor: 'Architecture Review Board',
    system: 'Enterprise Spec Registry',
    summary: 'Initial Project Alpha scope and Q4 target milestone approved with standard 6-week integration buffer.'
  },
  {
    id: 'h-dec-02',
    code: 'DEC-02',
    label: 'Decision 02',
    sublabel: 'Vendor API Contract Locked',
    status: 'neutral',
    x: 220,
    y: 55,
    isMainChain: false,
    timestamp: 'Oct 04, 14:20 UTC',
    actor: 'Platform Lead (Laptop)',
    system: 'Git Gateway / Spec Doc',
    summary: 'Schema v2.1 frozen for upstream telemetry ingestion.'
  },
  {
    id: 'h-dec-04',
    code: 'DEC-04',
    label: 'Decision 04',
    sublabel: 'Critical Schema Dependency Added',
    status: 'dependency',
    x: 245,
    y: 150,
    isMainChain: true,
    timestamp: 'Oct 09, 11:42 UTC',
    actor: 'Product Strategy Group',
    system: 'Change Control Record #408',
    summary: 'Introduced real-time encryption requirement coupled to legacy auth service without extending timeline.'
  },
  {
    id: 'h-wf-01',
    code: 'WF-01',
    label: 'Workflow 01',
    sublabel: 'Parallel UI Stream',
    status: 'dependency',
    x: 420,
    y: 55,
    isMainChain: false,
    timestamp: 'Oct 12, 16:05 UTC',
    actor: 'Frontend Squad (Desktop)',
    system: 'CI/CD Pipeline',
    summary: 'Client interface built against initial v2.1 mock contracts.'
  },
  {
    id: 'h-wf-02',
    code: 'WF-02',
    label: 'Workflow 02',
    sublabel: 'Core Sync Pipeline Execution',
    status: 'dependency',
    x: 430,
    y: 150,
    isMainChain: true,
    timestamp: 'Oct 15, 08:30 UTC',
    actor: 'Distributed Systems Team',
    system: 'Workflow Engine',
    summary: 'Downstream integration continued using pre-DEC-04 buffer assumptions while awaiting security sign-off.'
  },
  {
    id: 'h-dec-03',
    code: 'DEC-03',
    label: 'Decision 03',
    sublabel: 'Buffer Compression Override',
    status: 'risk',
    x: 430,
    y: 250,
    isMainChain: false,
    timestamp: 'Oct 16, 17:50 UTC',
    actor: 'Program Steering (iPad)',
    system: 'Executive Approval Portal',
    summary: 'QA stabilization window compressed from 14 days to 4 days to preserve external launch date.'
  },
  {
    id: 'h-app-delay',
    code: 'EVT-06',
    label: 'Approval Delay',
    sublabel: 'Security Gate Bottleneck (+9d)',
    status: 'risk',
    x: 615,
    y: 150,
    isMainChain: true,
    timestamp: 'Oct 24, 19:12 UTC',
    actor: 'Compliance Review Queue',
    system: 'Governance Workflow',
    summary: 'Mandatory cryptographic review occurred 9 days after planned deadline due to missing DEC-04 context.'
  },
  {
    id: 'h-missed',
    code: 'EVT-07',
    label: 'Missed Milestone',
    sublabel: 'Staging Freeze Breached',
    status: 'failure',
    x: 790,
    y: 150,
    isMainChain: true,
    timestamp: 'Nov 01, 22:00 UTC',
    actor: 'Release Automation',
    system: 'Deployment Gate',
    summary: 'Integration tests failed across 14 dependent endpoints; release candidate rejected.'
  },
  {
    id: 'h-failure',
    code: 'OUT-08',
    label: 'Project Failure',
    sublabel: 'Project Alpha Halted',
    status: 'failure',
    x: 945,
    y: 150,
    isMainChain: true,
    timestamp: 'Nov 04, 10:00 UTC',
    actor: 'Executive Committee',
    system: 'Portfolio Registry',
    summary: 'Project Alpha deployment aborted; post-mortem reconstruction initiated in Consecuencia.'
  }
];

const HERO_EDGES: HeroGraphEdge[] = [
  { from: 'h-dec-01', to: 'h-dec-02', isCriticalPath: false },
  { from: 'h-dec-01', to: 'h-dec-04', isCriticalPath: true },
  { from: 'h-dec-02', to: 'h-wf-01', isCriticalPath: false },
  { from: 'h-dec-04', to: 'h-wf-02', isCriticalPath: true },
  { from: 'h-dec-04', to: 'h-dec-03', isCriticalPath: false },
  { from: 'h-wf-01', to: 'h-app-delay', isCriticalPath: false },
  { from: 'h-wf-02', to: 'h-app-delay', isCriticalPath: true },
  { from: 'h-dec-03', to: 'h-app-delay', isCriticalPath: true },
  { from: 'h-app-delay', to: 'h-missed', isCriticalPath: true },
  { from: 'h-missed', to: 'h-failure', isCriticalPath: true }
];

const PROJECT_ALPHA_CHAIN: AlphaEvent[] = [
  {
    id: 'alpha-1',
    stepNumber: 1,
    code: 'Decision 01',
    title: 'Decision 01: Initial project scope approved.',
    shortTitle: 'Initial Scope Approved',
    category: 'Decision',
    status: 'neutral',
    isRootCauseChain: false,
    timestamp: '2026-08-14 · 10:00 UTC',
    responsibleRole: 'VP of Product & Architecture Review Board',
    deviceContext: 'Desktop Workstation',
    sourceSystem: 'Enterprise Charter Registry (DOC-8810)',
    description:
      'Project Alpha charter formally approved with a 12-week delivery schedule, three core service integrations, and a dedicated 2-week integration testing buffer.',
    relatedItem: 'Baseline Charter v1.0 & Engineering Capacity Plan',
    dependencies: ['Baseline Infrastructure Provisioning', 'Core API v2 Specification'],
    recordedEvidence: {
      factType: 'Signed Charter Approval Event',
      logId: 'LOG-ALPHA-00192',
      verbatimRecord: 'Approved scope: 3 microservices, 12-week window, mandatory 14-day stabilization freeze prior to cutover.',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'Baseline Reference Point',
      causalNote: 'Initial scope parameters were structurally sound based on historical team velocity; deviation originated in subsequent timeline and requirement modifications.'
    },
    downstreamEffects: [
      'Authorized Workflow 01 (Core development sprint initialization)',
      'Established initial milestone target dates across 4 engineering squads'
    ]
  },
  {
    id: 'alpha-2',
    stepNumber: 2,
    code: 'Decision 02',
    title: 'Decision 02: Delivery timeline shortened.',
    shortTitle: 'Timeline Shortened (-3 Wks)',
    category: 'Decision',
    status: 'risk',
    isRootCauseChain: true,
    timestamp: '2026-08-26 · 16:45 UTC',
    responsibleRole: 'Executive Steering Committee',
    deviceContext: 'iPad Pro',
    sourceSystem: 'Portfolio Roadmap Update (REV-204)',
    description:
      'Target delivery date pulled forward by 21 days to align with an external enterprise partner showcase, compressing the integration testing buffer from 14 days to 3 days.',
    relatedItem: 'Decision 01 (Initial project scope approved)',
    dependencies: ['Decision 01: Baseline Schedule', 'Partner Showcase Milestone'],
    recordedEvidence: {
      factType: 'Schedule Modification Approval',
      logId: 'LOG-ALPHA-00418',
      verbatimRecord: 'Target cutover moved from Nov 15 to Oct 25. Scope items #1–#3 retained unchanged; QA buffer adjusted to 72 hours.',
      verificationStatus: 'Authorized Event Log'
    },
    inferredExplanation: {
      confidenceNote: 'Primary Structural Risk Factor',
      causalNote: 'Shortening the delivery window without reducing scope removed the schedule margin needed to absorb downstream requirement changes or approval latency.'
    },
    downstreamEffects: [
      'Forced parallel execution of Workflow 01 and Workflow 02',
      'Eliminated slack time before mandatory security compliance gate'
    ]
  },
  {
    id: 'alpha-3',
    stepNumber: 3,
    code: 'Workflow 01',
    title: 'Workflow 01: Development begins.',
    shortTitle: 'Development Begins',
    category: 'Workflow',
    status: 'dependency',
    isRootCauseChain: false,
    timestamp: '2026-08-28 · 09:00 UTC',
    responsibleRole: 'Core Platform Engineering Lead',
    deviceContext: 'Desktop Workstation',
    sourceSystem: 'Engineering Sprint Tracker & Git Telemetry',
    description:
      'Backend and client engineering teams initiate sprint execution across 18 repositories based on the original v1.0 technical specification.',
    relatedItem: 'Decision 01 & Decision 02',
    dependencies: ['Decision 01: Initial Scope', 'Decision 02: Accelerated Schedule'],
    recordedEvidence: {
      factType: 'Workflow Initialization Event',
      logId: 'LOG-ALPHA-00509',
      verbatimRecord: 'Sprint 01–03 branches initialized against API Contract v1.0 (sha: 8f92b1c).',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'Normal Execution State',
      causalNote: 'Engineering progressed on schedule against initial assumptions, unaware of pending compliance requirement shifts.'
    },
    downstreamEffects: [
      'Created 14 downstream service dependencies tied to API Contract v1.0',
      'Triggered automated staging pipeline dependencies'
    ]
  },
  {
    id: 'alpha-4',
    stepNumber: 4,
    code: 'Decision 03',
    title: 'Decision 03: A critical requirement changes.',
    shortTitle: 'Critical Requirement Change',
    category: 'Decision',
    status: 'risk',
    isRootCauseChain: true,
    timestamp: '2026-09-14 · 14:12 UTC',
    responsibleRole: 'Product Management & Security Architect',
    deviceContext: 'Enterprise Laptop',
    sourceSystem: 'Specification Change Request (SCR-119)',
    description:
      'Mid-sprint requirement introduced mandating payload-level customer-managed encryption keys (CMEK) across all data synchronization endpoints.',
    relatedItem: 'Workflow 01 (Development begins)',
    dependencies: ['Workflow 01: API Contract v1.0', 'External Security Policy Mandate'],
    recordedEvidence: {
      factType: 'Specification Amendment Log',
      logId: 'LOG-ALPHA-00891',
      verbatimRecord: 'SCR-119 marked Approved: Replace standard TLS-only payload handling with per-tenant CMEK envelope encryption.',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'High-Impact Inflection Point',
      causalNote: 'Requirement change invalidated the authentication schema used by dependent teams, but no automated dependency propagation blocked downstream workflows.'
    },
    downstreamEffects: [
      'Invalidated token validation assumptions in Workflow 02',
      'Added mandatory cryptographic review gate prior to production deployment'
    ]
  },
  {
    id: 'alpha-5',
    stepNumber: 5,
    code: 'Workflow 02',
    title: 'Workflow 02: Dependent work continues using outdated assumptions.',
    shortTitle: 'Outdated Assumptions Used',
    category: 'Workflow',
    status: 'dependency',
    isRootCauseChain: true,
    timestamp: '2026-09-16 to 2026-10-04',
    responsibleRole: 'Client Integration & Mobile Sync Teams',
    deviceContext: 'Enterprise Laptop',
    sourceSystem: 'Cross-Team Build & Artifact Graph',
    description:
      'Three downstream product squads continued building client sync modules against the deprecated v1.0 unencrypted payload schema for 18 days after Decision 03.',
    relatedItem: 'Decision 03 (A critical requirement changes)',
    dependencies: ['Workflow 01: Mock Service Artifacts', 'Decision 03: Unpropagated Spec Change'],
    recordedEvidence: {
      factType: 'Dependency Drift Detection',
      logId: 'LOG-ALPHA-01140',
      verbatimRecord: '47 pull requests merged into client-sync-main referencing auth-schema-v1.0 after SCR-119 approval timestamp.',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'Critical Execution Gap',
      causalNote: 'Because specification changes in the document tool were disconnected from repository dependency graphs, teams executed 18 days of incompatible work.'
    },
    downstreamEffects: [
      'Produced incompatible payload serializers across desktop and mobile clients',
      'Created late-stage rework spike immediately before approval gate'
    ]
  },
  {
    id: 'alpha-6',
    stepNumber: 6,
    code: 'Event 06',
    title: 'Event 06: Approval is delayed.',
    shortTitle: 'Approval Delayed (+9 Days)',
    category: 'Event',
    status: 'risk',
    isRootCauseChain: true,
    timestamp: '2026-10-15 · 18:30 UTC',
    responsibleRole: 'Enterprise Risk & Governance Reviewer',
    deviceContext: 'Smartphone',
    sourceSystem: 'Governance Sign-off Queue (GATE-77)',
    description:
      'Security architecture sign-off was delayed by 9 business days when reviewers discovered mismatches between Decision 03 encryption requirements and Workflow 02 implementation artifacts.',
    relatedItem: 'Decision 03 & Workflow 02',
    dependencies: ['Decision 03: CMEK Requirement', 'Workflow 02: Client Sync Implementation'],
    recordedEvidence: {
      factType: 'Approval SLA Breach Event',
      logId: 'LOG-ALPHA-01482',
      verbatimRecord: 'Gate-77 status: ON_HOLD. Elapsed wait: 9d 06h beyond SLA. Reason: Missing end-to-end key rotation verification in client sync.',
      verificationStatus: 'Authorized Event Log'
    },
    inferredExplanation: {
      confidenceNote: 'Compound Bottleneck',
      causalNote: 'The approval delay was a direct downstream consequence of the unaligned assumptions between Decision 03 and Workflow 02, amplified by the shortened timeline from Decision 02.'
    },
    downstreamEffects: [
      'Consumed 100% of remaining 72-hour QA stabilization buffer',
      'Blocked staging environment promotion required for Event 07'
    ]
  },
  {
    id: 'alpha-7',
    stepNumber: 7,
    code: 'Event 07',
    title: 'Event 07: Delivery milestone is missed.',
    shortTitle: 'Delivery Milestone Missed',
    category: 'Event',
    status: 'failure',
    isRootCauseChain: true,
    timestamp: '2026-10-25 · 00:00 UTC',
    responsibleRole: 'Release Management & Program Office',
    deviceContext: 'Desktop Workstation',
    sourceSystem: 'Release Readiness Monitor (REL-Q4)',
    description:
      'The October 25 delivery milestone was missed after emergency integration patches caused cascading regressions across 14 dependent API endpoints.',
    relatedItem: 'Decision 02 & Event 06',
    dependencies: ['Decision 02: Oct 25 Target Date', 'Event 06: Delayed Security Sign-off'],
    recordedEvidence: {
      factType: 'Milestone Breach Telemetry',
      logId: 'LOG-ALPHA-01790',
      verbatimRecord: 'Milestone M4_CUTOVER status: FAILED. Blocking defects: 14 critical schema mismatches; 0h buffer remaining.',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'Proximate Failure Trigger',
      causalNote: 'Missing the milestone was the visible symptom of four converging upstream factors: schedule compression, mid-stream scope change, unpropagated assumptions, and approval latency.'
    },
    downstreamEffects: [
      'Triggered executive escalation protocol',
      'Led directly to Project Alpha cancellation / reset outcome'
    ]
  },
  {
    id: 'alpha-8',
    stepNumber: 8,
    code: 'Outcome',
    title: 'Outcome: Project Alpha fails.',
    shortTitle: 'Project Alpha Fails',
    category: 'Outcome',
    status: 'failure',
    isRootCauseChain: true,
    timestamp: '2026-10-29 · 11:15 UTC',
    responsibleRole: 'Executive Leadership & PMO',
    deviceContext: 'Desktop Workstation',
    sourceSystem: 'Consecuencia Root-Cause Reconstruction Report',
    description:
      'Project Alpha deployment is halted and marked failed for Q4. Consecuencia reconstructs the complete 8-node causal chain so leadership can replace guesswork with verifiable organizational learning.',
    relatedItem: 'Complete Project Alpha Causal Graph (Nodes 01–07)',
    dependencies: ['Decision 02', 'Decision 03', 'Workflow 02', 'Event 06', 'Event 07'],
    recordedEvidence: {
      factType: 'Portfolio Outcome Record',
      logId: 'LOG-ALPHA-01999',
      verbatimRecord: 'Project Alpha status set to HALTED_POSTMORTEM. Causal trace exported with 7 linked upstream records.',
      verificationStatus: 'Verified System Record'
    },
    inferredExplanation: {
      confidenceNote: 'Synthesized Root-Cause Summary (Requires Human Validation)',
      causalNote: 'Project Alpha did not fail from a single engineering error on Oct 25. It failed through a traceable chain starting when the timeline was shortened (Decision 02) and a critical requirement changed (Decision 03) without updating dependent workflows (Workflow 02).'
    },
    downstreamEffects: [
      'Root-cause evidence archived for organizational learning',
      'Dependency alert rule proposed to prevent unpropagated spec changes in future initiatives'
    ]
  }
];

const STAKEHOLDER_USE_CASES: StakeholderUseCase[] = [
  {
    id: 'exec',
    role: 'Executive Leadership',
    headline: 'Move from post-mortem guesswork to evidence-backed portfolio governance.',
    description:
      'When strategic initiatives slip or fail, leadership often receives fragmented narratives. Consecuencia provides an objective, traceable chain of how key decisions, timeline shifts, and resource trade-offs interacted across the organization.',
    keyQuestionsAnswered: [
      'Where did strategic execution diverge from the approved charter?',
      'Did schedule compression amplify downstream delivery risks?',
      'What structural patterns recur across delayed enterprise initiatives?'
    ],
    authorizedSources: ['Portfolio Charter Logs', 'Executive Steering Approvals', 'Milestone Gate Records'],
    accessScope: 'Aggregated Portfolio & Cross-Program Causal Summaries'
  },
  {
    id: 'pmo',
    role: 'Project & Program Managers',
    headline: 'See how a change in one workstream ripples across every dependent milestone.',
    description:
      'Program managers juggle dozens of moving specs, approvals, and cross-team handoffs. Consecuencia links specification updates and approval queues directly to the workflows that depend on them.',
    keyQuestionsAnswered: [
      'Which active workflows rely on an assumption that just changed?',
      'Which pending approval is silently blocking a critical path milestone?',
      'How did incremental scope changes accumulate into a delivery slip?'
    ],
    authorizedSources: ['Program Roadmaps', 'Change Control Queues', 'Cross-Team Dependency Graphs'],
    accessScope: 'Program-Level Timeline, Dependencies & Milestone Traceability'
  },
  {
    id: 'ops',
    role: 'Operations Teams',
    headline: 'Identify process bottlenecks and handoff friction across operational workflows.',
    description:
      'Operational breakdowns rarely happen in isolation. Trace how handoffs, review queues, and exception approvals perform across departments and device contexts.',
    keyQuestionsAnswered: [
      'Where do cross-departmental handoffs routinely stall?',
      'How do ad-hoc mobile or tablet approvals impact downstream SLA adherence?',
      'Which operational workflows lack clear ownership boundaries?'
    ],
    authorizedSources: ['Workflow Engines', 'Service SLA Logs', 'Operational Sign-off Records'],
    accessScope: 'Operational Process Flows & Queue Latency Telemetry'
  },
  {
    id: 'prod-eng',
    role: 'Product & Engineering Teams',
    headline: 'Preserve the technical and product context behind every architectural trade-off.',
    description:
      'Months into a complex build, teams often lose sight of why an architectural constraint was introduced. Consecuencia connects PRs, spec revisions, and design sign-offs into a living technical history.',
    keyQuestionsAnswered: [
      'Why was this architecture decision made, and what evidence supported it?',
      'Did a downstream service continue building against a deprecated spec?',
      'Which requirement shift triggered the late-stage integration failure?'
    ],
    authorizedSources: ['Spec Repositories', 'CI/CD Release Gates', 'Architecture Decision Records (ADRs)'],
    accessScope: 'Technical Decision Graph, Spec Lineage & Build Dependencies'
  },
  {
    id: 'risk',
    role: 'Risk & Compliance Teams',
    headline: 'Verify that required approvals, reviews, and governance checks occurred in sequence.',
    description:
      'Maintain an auditable, tamper-evident trail of project decisions, policy exceptions, and authorization timestamps without invasive employee monitoring.',
    keyQuestionsAnswered: [
      'Who authorized a scope or security exception, and under what assumptions?',
      'Did work proceed before mandatory compliance sign-off was completed?',
      'Is there a clear, auditable chain of custody for project governance events?'
    ],
    authorizedSources: ['Governance Portals', 'Compliance Gate Logs', 'Policy Exception Registries'],
    accessScope: 'Role-Scoped Audit Trails & Governance Verification Records'
  },
  {
    id: 'xfunc',
    role: 'Cross-Functional Enterprise Projects',
    headline: 'Unify distributed teams operating across tools, time zones, and authorized devices.',
    description:
      'Large initiatives span product, legal, security, finance, and engineering. Consecuencia bridges disconnected systems so every team operates from a shared chain of context.',
    keyQuestionsAnswered: [
      'How did a legal or security review update affect engineering delivery dates?',
      'Are all workstreams aligned on the latest approved project assumptions?',
      'What is the end-to-end story of this initiative from charter to outcome?'
    ],
    authorizedSources: ['Enterprise Workspace Integrations', 'Cross-Department Milestones', 'Authorized Device Events'],
    accessScope: 'Permission-Filtered Cross-Functional Project Graph'
  }
];

// ---------------------------------------------------------------------------
// Helper UI Components
// ---------------------------------------------------------------------------

function StatusBadge({ status, label }: { status: NodeStatus; label?: string }) {
  const styles: Record<NodeStatus, string> = {
    neutral: 'bg-slate-800/90 text-slate-200 border-slate-600/60',
    dependency: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    risk: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    failure: 'bg-rose-950/85 text-rose-300 border-rose-500/50'
  };

  const dotColors: Record<NodeStatus, string> = {
    neutral: 'bg-slate-400',
    dependency: 'bg-blue-400',
    risk: 'bg-amber-400',
    failure: 'bg-rose-500'
  };

  const defaultLabels: Record<NodeStatus, string> = {
    neutral: 'Normal Decision',
    dependency: 'Dependency / Workflow',
    risk: 'Risk / Delay Signal',
    failure: 'Critical Failure Point'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {label || defaultLabels[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------

export default function App() {
  // Navigation & Modal State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [earlyAccessModalOpen, setEarlyAccessModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Hero Interactive State
  const [selectedHeroNodeId, setSelectedHeroNodeId] = useState<string>('h-app-delay');
  const [highlightHeroCriticalPath, setHighlightHeroCriticalPath] = useState<boolean>(true);
  const [heroHeadlineVariant, setHeroHeadlineVariant] = useState<'primary' | 'alt'>('primary');

  // Problem Section Interactive State ("Fragmented Silos" vs "Connected Chain")
  const [problemViewMode, setProblemViewMode] = useState<'fragmented' | 'connected'>('connected');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Solution Capability Selection
  const [activeCapabilityIndex, setActiveCapabilityIndex] = useState<number>(0);

  // How It Works Step Selection
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2);

  // Interactive Project Alpha Demo State
  const [selectedAlphaEventId, setSelectedAlphaEventId] = useState<string>('alpha-6');
  const [traceRootCauseActive, setTraceRootCauseActive] = useState<boolean>(false);
  const [alphaFilter, setAlphaFilter] = useState<'all' | 'root-cause' | 'decisions' | 'workflows'>('all');

  // Designed for Complex Organizations State
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>('exec');

  // Early Access Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'VP of Engineering / CTO',
    focusArea: 'Post-Mortem & Root-Cause Traceability'
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Derived selections
  const selectedHeroNode = useMemo(
    () => HERO_NODES.find((n) => n.id === selectedHeroNodeId) || HERO_NODES[6],
    [selectedHeroNodeId]
  );

  const selectedAlphaEvent = useMemo(
    () => PROJECT_ALPHA_CHAIN.find((e) => e.id === selectedAlphaEventId) || PROJECT_ALPHA_CHAIN[5],
    [selectedAlphaEventId]
  );

  const filteredAlphaEvents = useMemo(() => {
    return PROJECT_ALPHA_CHAIN.filter((ev) => {
      if (alphaFilter === 'root-cause') return ev.isRootCauseChain;
      if (alphaFilter === 'decisions') return ev.category === 'Decision';
      if (alphaFilter === 'workflows') return ev.category === 'Workflow' || ev.category === 'Event';
      return true;
    });
  }, [alphaFilter]);

  const selectedUseCase = useMemo(
    () => STAKEHOLDER_USE_CASES.find((u) => u.id === selectedUseCaseId) || STAKEHOLDER_USE_CASES[0],
    [selectedUseCaseId]
  );

  // Smooth Scroll Helper
  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Trigger Trace Back to Root Cause in Project Alpha Demo
  const handleTriggerTraceRootCause = () => {
    const nextState = !traceRootCauseActive;
    setTraceRootCauseActive(nextState);
    if (nextState) {
      setSelectedAlphaEventId('alpha-8');
    }
  };

  // Step through Project Alpha events
  const handleStepAlphaEvent = (direction: 'prev' | 'next') => {
    const currentIndex = PROJECT_ALPHA_CHAIN.findIndex((e) => e.id === selectedAlphaEventId);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedAlphaEventId(PROJECT_ALPHA_CHAIN[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < PROJECT_ALPHA_CHAIN.length - 1) {
      setSelectedAlphaEventId(PROJECT_ALPHA_CHAIN[currentIndex + 1].id);
    }
  };

  // Form Submission Handler (Honest Demo State)
  const handleEarlyAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim()) {
      setFormError('Please provide your full name, work email, and company name to preview the workspace configuration.');
      return;
    }
    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid work email address.');
      return;
    }
    setFormError(null);
    setFormSubmitted(true);
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify(
      {
        mode: 'DEMO_PREVIEW_NO_BACKEND',
        timestamp: new Date().toISOString(),
        applicant: formData
      },
      null,
      2
    );
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    } catch {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    }
  };

  const scatteredQuestions = [
    {
      question: 'Why was a decision made?',
      silo: 'Buried in a closed slide deck & ephemeral chat thread',
      connected: 'Linked directly to Charter Record DEC-01 with rationale, owner, and timestamp'
    },
    {
      question: 'Which assumptions were used?',
      silo: 'Implicit in an outdated spreadsheet tab from Q2',
      connected: 'Explicitly versioned as Baseline Assumption Set v1.0 attached to the decision node'
    },
    {
      question: 'Who approved the change?',
      silo: 'A quick mobile sign-off with no link to engineering scope',
      connected: 'Recorded as authorized governance event SCR-119 with role context and scope impact'
    },
    {
      question: 'Which workflow depended on that decision?',
      silo: 'Downstream teams unaware their API schema was invalidated',
      connected: 'Dependency edge automatically mapped between Decision 03 and Workflow 02'
    },
    {
      question: 'When did the project begin to deviate?',
      silo: 'Only noticed weeks later when the final milestone failed',
      connected: 'Pinpointed to the 18-day window where Workflow 02 executed on pre-change assumptions'
    },
    {
      question: 'Which warning signs were missed?',
      silo: 'Approval queue delay treated as an isolated ticket issue',
      connected: 'Surfaced as a compounding critical-path risk consuming 100% of QA buffer'
    },
    {
      question: 'What could have prevented the outcome?',
      silo: 'Subjective post-mortem debates with conflicting memories',
      connected: 'Evidence-backed causal trace showing where automated spec propagation was needed'
    }
  ];

  const capabilities = [
    {
      id: 'cap-1',
      number: '01',
      title: 'Decision Traceability',
      subtitle: 'Structured Context & Lineage',
      description:
        'Capture important project decisions, their context, supporting evidence, owners, timestamps, and related outcomes.',
      metricsLabel: 'Decision Record Structure',
      sampleFields: [
        { k: 'Decision ID', v: 'DEC-2026-04 (Schema Mandate)' },
        { k: 'Authorized Owner', v: 'Security Architecture Lead' },
        { k: 'Supporting Evidence', v: 'Policy Spec #882, Benchmark Log' },
        { k: 'Downstream Links', v: '3 Workflows · 2 Milestone Gates' }
      ],
      note: 'Preserves institutional memory across leadership transitions and complex timelines.'
    },
    {
      id: 'cap-2',
      number: '02',
      title: 'Workflow Intelligence',
      subtitle: 'Cross-Team Process Topology',
      description:
        'Connect tasks, approvals, dependencies, milestones, and process changes to reveal how work moves across teams.',
      metricsLabel: 'Workflow Dependency Mapping',
      sampleFields: [
        { k: 'Upstream Trigger', v: 'Decision 03 (Requirement Change)' },
        { k: 'Affected Stream', v: 'Workflow 02 (Client Sync Module)' },
        { k: 'Approval Gate', v: 'GATE-77 (Cryptographic Review)' },
        { k: 'Propagation State', v: 'Schema Mismatch Detected (+18d Drift)' }
      ],
      note: 'Exposes hidden cross-departmental dependencies before or after execution breakdowns.'
    },
    {
      id: 'cap-3',
      number: '03',
      title: 'Cross-Device Activity Integration',
      subtitle: 'Permissioned Enterprise Event Capture',
      description:
        'Design for authorized integration across company-managed or employee-authorized iPads, phones, desktops, and laptops, subject to platform capabilities and organizational permissions.',
      metricsLabel: 'Authorized Workplace Event Scope',
      sampleFields: [
        { k: 'Desktop / Laptop', v: 'Spec Commits, Architecture Sign-offs, Release Gates' },
        { k: 'iPad / Tablet', v: 'Executive Charter Approvals, Steering Reviews' },
        { k: 'Smartphone', v: 'Authorized Escalation Sign-offs, Change Approvals' },
        { k: 'Privacy Boundary', v: 'Structured Business Events Only (Zero Private Surveillance)' }
      ],
      note: 'Prioritizes structured business events and workplace application integrations—never unrestricted access to personal activity.'
    },
    {
      id: 'cap-4',
      number: '04',
      title: 'Root-Cause Analysis',
      subtitle: 'Backward Causal Navigation',
      description:
        'When an outcome goes wrong, help users navigate backward through related decisions, changes, dependencies, and workflow events to identify likely contributing factors.',
      metricsLabel: 'Epistemic Clarity Protocol',
      sampleFields: [
        { k: 'Recorded Facts', v: 'Immutable timestamps, sign-off logs, artifact versions' },
        { k: 'Inferred Explanations', v: 'Causal model hypotheses linking drift to delay' },
        { k: 'Distinction Layer', v: 'Explicit UI separation of Fact vs. Inference' },
        { k: 'Governance Step', v: 'Mandatory human validation before archiving findings' }
      ],
      note: 'Clearly distinguishes recorded facts from inferred explanations so teams never confuse raw telemetry with unverified assumptions.'
    }
  ];

  const howItWorksSteps = [
    {
      step: 'Step 01',
      title: 'Connect',
      summary: 'Connect authorized workplace systems and devices to the organization’s Consecuencia workspace.',
      detail:
        'Administrators configure permission-scoped connectors for project management suites, document registries, code repositories, approval workflows, and authorized enterprise devices (desktops, laptops, iPads, smartphones).',
      artifactPreview: 'Authorized Connectors: Issue Tracker · Spec Registry · Release Gates · Governance Queue',
      badge: 'Permission-Based Integration'
    },
    {
      step: 'Step 02',
      title: 'Capture',
      summary: 'Record relevant decisions, approvals, workflow changes, dependencies, and milestones with timestamps and context.',
      detail:
        'As projects execute, Consecuencia ingests structured business events—capturing who approved a change, what baseline assumptions were active, and which artifacts were updated.',
      artifactPreview: 'Captured Event: [2026-09-14 14:12 UTC] SCR-119 Approved by Security Lead · Linked to API v1.0',
      badge: 'Structured Event Telemetry'
    },
    {
      step: 'Step 03',
      title: 'Connect the Chain',
      summary: 'Build a structured project timeline and relationship graph showing how events and decisions relate to one another.',
      detail:
        'Consecuencia resolves relationships across disparate tools, linking upstream decisions to the downstream workflows, approvals, and milestones that depend on them.',
      artifactPreview: 'Graph Edge: Decision 03 (Spec Change) ──[invalidates assumption]──> Workflow 02 (Client Build)',
      badge: 'Causal Graph Construction'
    },
    {
      step: 'Step 04',
      title: 'Discover Why',
      summary: 'Investigate failures, trace contributing events, inspect supporting evidence, and generate a clear explanation of the likely root causes.',
      detail:
        'When a milestone slips or an initiative fails, teams traverse backward from the outcome to inspect verified system records alongside clearly labeled causal hypotheses.',
      artifactPreview: 'Root-Cause Trace: Timeline Compression + Unpropagated Spec Change + Approval Delay → Missed Milestone',
      badge: 'Evidence-Based Root Cause'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* Subtle Background Grid & Ambient Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] pointer-events-none z-0 opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.28), rgba(139, 92, 246, 0.12) 45%, transparent 75%)'
        }}
      />

      {/* ------------------------------------------------------------------- */}
      {/* 13. Navigation Header                                               */}
      {/* ------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#07090E]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-400/40 flex items-center justify-center shadow-inner">
              <GitBranch className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-white block leading-none">
                CONSECUENCIA
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mt-0.5">
                Decision Traceability
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={() => scrollToSection('product')}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Product
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('project-alpha-demo')}
              className="px-3 py-2 text-sm text-blue-300 hover:text-blue-200 rounded-md hover:bg-blue-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Interactive Demo
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('use-cases')}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Use Cases
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('security')}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right CTA & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEarlyAccessModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-sm shadow-blue-950/50 transition-all cursor-pointer"
            >
              <span>Get Early Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B0F17] border-b border-white/[0.08] px-4 pt-3 pb-5 space-y-2">
            <button
              type="button"
              onClick={() => scrollToSection('product')}
              className="block w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] rounded-lg"
            >
              Product
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] rounded-lg"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('project-alpha-demo')}
              className="block w-full text-left px-3 py-2.5 text-sm text-blue-300 font-medium hover:bg-blue-500/10 rounded-lg"
            >
              Project Alpha Interactive Demo
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('use-cases')}
              className="block w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] rounded-lg"
            >
              Use Cases
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('security')}
              className="block w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] rounded-lg"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] rounded-lg"
            >
              About
            </button>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEarlyAccessModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white text-center flex items-center justify-center gap-2"
              >
                <span>Get Early Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* ----------------------------------------------------------------- */}
        {/* 4. Hero Section                                                   */}
        {/* ----------------------------------------------------------------- */}
        <section className="pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-400/25 text-blue-300 text-xs font-mono uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>PROJECT INTELLIGENCE. COMPLETE TRACEABILITY.</span>
            </div>

            {/* Main Headline with optional Brand Promise Switcher */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.08] mb-6">
              {heroHeadlineVariant === 'primary' ? (
                <>
                  Every failure has a chain.{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                    Find it.
                  </span>
                </>
              ) : (
                <>
                  Know exactly what went wrong.{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                    And why.
                  </span>
                </>
              )}
            </h1>

            {/* Subtle toggle to preview alternative headline */}
            <div className="mb-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Core Promise View:</span>
              <button
                type="button"
                onClick={() => setHeroHeadlineVariant('primary')}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  heroHeadlineVariant === 'primary'
                    ? 'bg-white/10 text-white border-white/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Every failure has a chain
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setHeroHeadlineVariant('alt')}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  heroHeadlineVariant === 'alt'
                    ? 'bg-white/10 text-white border-white/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Know exactly what went wrong
              </button>
            </div>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-4">
              Projects rarely fail because of one event. They fail through a chain of decisions, dependencies,
              overlooked signals, and execution gaps.
            </p>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto mb-9">
              Consecuencia helps you trace that chain, uncover contributing factors, and understand the real story
              behind every project outcome.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
              <button
                type="button"
                onClick={() => scrollToSection('project-alpha-demo')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm sm:text-base bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <span>Explore Consecuencia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm sm:text-base bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>See How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Subtle Product Statement */}
            <p className="text-xs sm:text-sm font-mono text-slate-400 tracking-wide">
              From the first decision to the final outcome.
            </p>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Hero Visual: Interactive Decision Graph & Root-Cause Panel       */}
          {/* --------------------------------------------------------------- */}
          <div className="mt-12 lg:mt-16 rounded-2xl bg-[#0B0F17]/95 border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
            {/* Window Top Bar */}
            <div className="px-4 sm:px-6 py-3.5 bg-[#101624] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                </div>
                <span className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    OUTCOME: HALTED
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-semibold text-white tracking-wide">
                    PROJECT ALPHA // DECISION &amp; DEPENDENCY GRAPH
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHighlightHeroCriticalPath(!highlightHeroCriticalPath)}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                    highlightHeroCriticalPath
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{highlightHeroCriticalPath ? 'Critical Chain Highlighted' : 'Highlight Critical Chain'}</span>
                </button>
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono text-slate-400">
                  <Info className="w-3 h-3 text-blue-400" />
                  PRODUCT CONCEPT · ILLUSTRATIVE SAMPLE
                </span>
              </div>
            </div>

            {/* Main Hero Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left/Center: Connected Node Graph (8 cols on lg) */}
              <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-gradient-to-b from-[#0B0F17] to-[#080B11]">
                {/* Legend & Instruction Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Neutral Decision
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      Dependency / Workflow
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Risk / Delay
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Critical Failure Point
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Click any node to inspect telemetry
                  </span>
                </div>

                {/* Responsive SVG Graph */}
                <div className="w-full overflow-x-auto pb-2">
                  <div className="min-w-[680px]">
                    <svg
                      viewBox="0 0 1040 310"
                      className="w-full h-auto select-none"
                      role="img"
                      aria-label="Project Alpha connected decision graph showing Decision 01 leading to Decision 04, Workflow 02, Approval Delay, Missed Milestone, and Project Failure"
                    >
                      <defs>
                        <marker
                          id="arrow-critical"
                          viewBox="0 0 10 10"
                          refX="7"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1 L 8 5 L 0 9 z" fill="#60A5FA" />
                        </marker>
                        <marker
                          id="arrow-muted"
                          viewBox="0 0 10 10"
                          refX="7"
                          refY="5"
                          markerWidth="5"
                          markerHeight="5"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569" />
                        </marker>
                      </defs>

                      {/* Subtle Horizontal Swimlane Guides */}
                      <line x1="20" y1="55" x2="1020" y2="55" stroke="rgba(148,163,184,0.07)" strokeDasharray="4 4" />
                      <line x1="20" y1="150" x2="1020" y2="150" stroke="rgba(148,163,184,0.12)" strokeDasharray="4 4" />
                      <line x1="20" y1="250" x2="1020" y2="250" stroke="rgba(148,163,184,0.07)" strokeDasharray="4 4" />

                      <text x="24" y="42" fill="#64748B" fontSize="9" fontFamily="monospace">
                        PARALLEL WORKSTREAMS
                      </text>
                      <text x="24" y="136" fill="#93C5FD" fontSize="9" fontFamily="monospace">
                        PRIMARY CAUSAL CHAIN (PROJECT ALPHA)
                      </text>
                      <text x="24" y="236" fill="#64748B" fontSize="9" fontFamily="monospace">
                        GOVERNANCE &amp; SCHEDULE OVERRIDES
                      </text>

                      {/* Edges */}
                      {HERO_EDGES.map((edge, idx) => {
                        const fromNode = HERO_NODES.find((n) => n.id === edge.from);
                        const toNode = HERO_NODES.find((n) => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        const x1 = fromNode.x + 58;
                        const y1 = fromNode.y;
                        const x2 = toNode.x - 62;
                        const y2 = toNode.y;
                        const midX = (x1 + x2) / 2;
                        const pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                        const isHighlighted = highlightHeroCriticalPath && edge.isCriticalPath;

                        return (
                          <g key={`edge-${idx}`}>
                            {isHighlighted && (
                              <path
                                d={pathData}
                                fill="none"
                                stroke="rgba(59, 130, 246, 0.25)"
                                strokeWidth="6"
                              />
                            )}
                            <path
                              d={pathData}
                              fill="none"
                              stroke={isHighlighted ? '#60A5FA' : '#334155'}
                              strokeWidth={isHighlighted ? '2.2' : '1.5'}
                              strokeDasharray={edge.isCriticalPath ? undefined : '4 4'}
                              markerEnd={isHighlighted ? 'url(#arrow-critical)' : 'url(#arrow-muted)'}
                            />
                          </g>
                        );
                      })}

                      {/* Nodes */}
                      {HERO_NODES.map((node) => {
                        const isSelected = node.id === selectedHeroNodeId;
                        const strokeMap: Record<NodeStatus, string> = {
                          neutral: isSelected ? '#E2E8F0' : '#475569',
                          dependency: isSelected ? '#60A5FA' : '#2563EB',
                          risk: isSelected ? '#FBBF24' : '#D97706',
                          failure: isSelected ? '#FB7185' : '#E11D48'
                        };
                        const fillMap: Record<NodeStatus, string> = {
                          neutral: '#0F172A',
                          dependency: '#0C1938',
                          risk: '#271705',
                          failure: '#2A0A14'
                        };
                        const badgeFillMap: Record<NodeStatus, string> = {
                          neutral: '#64748B',
                          dependency: '#3B82F6',
                          risk: '#F59E0B',
                          failure: '#F43F5E'
                        };

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => setSelectedHeroNodeId(node.id)}
                            className="cursor-pointer"
                          >
                            {isSelected && (
                              <rect
                                x="-64"
                                y="-34"
                                width="128"
                                height="68"
                                rx="12"
                                fill="none"
                                stroke={strokeMap[node.status]}
                                strokeWidth="1.5"
                                strokeOpacity="0.5"
                              />
                            )}
                            <rect
                              x="-58"
                              y="-28"
                              width="116"
                              height="56"
                              rx="9"
                              fill={fillMap[node.status]}
                              stroke={strokeMap[node.status]}
                              strokeWidth={isSelected ? '2' : '1.2'}
                            />
                            <circle cx="-44" cy="-12" r="4" fill={badgeFillMap[node.status]} />
                            <text
                              x="-34"
                              y="-9"
                              fill="#94A3B8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="600"
                            >
                              {node.code}
                            </text>
                            <text
                              x="-48"
                              y="7"
                              fill="#F8FAFC"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {node.label}
                            </text>
                            <text
                              x="-48"
                              y="20"
                              fill="#94A3B8"
                              fontSize="8.5"
                            >
                              {node.sublabel.length > 22 ? node.sublabel.slice(0, 21) + '...' : node.sublabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Selected Node Live Inspection Bar */}
                <div className="mt-3 p-3.5 rounded-xl bg-[#111827]/90 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-400">
                        [{selectedHeroNode.code}]
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {selectedHeroNode.label}: {selectedHeroNode.sublabel}
                      </span>
                      <StatusBadge status={selectedHeroNode.status} />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedHeroNode.summary}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right font-mono text-[11px] text-slate-400 space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                    <div>{selectedHeroNode.timestamp}</div>
                    <div className="text-slate-300">{selectedHeroNode.actor}</div>
                    <div className="text-blue-400/90">{selectedHeroNode.system}</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Root-Cause Analysis Panel (4 cols on lg) */}
              <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0E131F] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                        Root-Cause Analysis
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                      4 Key Findings
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Automated backward traversal from{' '}
                    <span className="text-rose-300 font-medium">Project Failure</span> across 9 connected organizational nodes:
                  </p>

                  {/* 4 Required Findings */}
                  <ul className="space-y-3">
                    <li
                      onClick={() => setSelectedHeroNodeId('h-dec-04')}
                      className="p-3 rounded-xl bg-[#141B2D] hover:bg-[#192238] border border-blue-500/25 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-blue-300 mb-1">
                        <span>01 · DEPENDENCY INJECTION</span>
                        <span>DEC-04 → WF-02</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-100">
                        Critical dependency introduced a delay.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Real-time CMEK encryption mandate added mid-sprint without adjusting downstream schedule margin.
                      </p>
                    </li>

                    <li
                      onClick={() => setSelectedHeroNodeId('h-app-delay')}
                      className="p-3 rounded-xl bg-[#141B2D] hover:bg-[#192238] border border-amber-500/25 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 mb-1">
                        <span>02 · GOVERNANCE BOTTLENECK</span>
                        <span>EVT-06 (+9d SLA)</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-100">
                        Approval occurred after the planned deadline.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Security review stalled for 9 business days awaiting reconciliation of schema assumptions.
                      </p>
                    </li>

                    <li
                      onClick={() => setSelectedHeroNodeId('h-wf-02')}
                      className="p-3 rounded-xl bg-[#141B2D] hover:bg-[#192238] border border-blue-500/25 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-blue-300 mb-1">
                        <span>03 · EXECUTION DRIFT</span>
                        <span>WF-02</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-100">
                        Downstream workflow was affected.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dependent sync squads built against outdated v1.0 specifications while awaiting sign-off clarity.
                      </p>
                    </li>

                    <li
                      onClick={() => setSelectedHeroNodeId('h-missed')}
                      className="p-3 rounded-xl bg-[#141B2D] hover:bg-[#192238] border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-rose-300 mb-1">
                        <span>04 · OUTCOME IMPACT</span>
                        <span>EVT-07 → OUT-08</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-100">
                        Final milestone was missed.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Compressed QA buffer could not absorb 14 endpoint regressions at release cutover.
                      </p>
                    </li>
                  </ul>
                </div>

                {/* Clear Product Concept Disclaimer */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-start gap-2 text-[11px] text-slate-400">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-300">Illustrative Product Concept:</strong> Sample visualization of Project Alpha demonstrating how Consecuencia links recorded events to root-cause explanations. Not actual customer data.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 5. The Problem Section (#about)                                   */}
        {/* ----------------------------------------------------------------- */}
        <section id="about" className="py-20 md:py-28 border-t border-white/[0.07] bg-[#090C14]/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                01 // THE DIAGNOSTIC BLIND SPOT
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
                You see the failure. But do you know the cause?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4">
                Modern enterprises operate across disconnected systems, documents, chat channels, approval queues, and distributed teams.
              </p>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                When a high-stakes initiative derails, leaders see the missed deadline—but the context explaining{' '}
                <em className="text-slate-200 not-italic font-medium">how</em> one seemingly minor decision created a downstream cascade is scattered across dozens of tools.
              </p>
            </div>

            {/* Interactive Comparison: Fragmented Silos vs. Connected Chain */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 5 Cols: The 7 Scattered Context Questions */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>When a project fails, critical context is scattered:</span>
                  <span className="text-blue-400">Select to inspect</span>
                </div>
                {scatteredQuestions.map((item, idx) => {
                  const isActive = activeQuestionIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/35 border-blue-500/40 text-white shadow-md'
                          : 'bg-[#0D121D] border-white/[0.07] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-md text-xs font-mono flex items-center justify-center border ${
                            isActive
                              ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                              : 'bg-white/[0.03] border-white/10 text-slate-400'
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        <span className="text-sm font-medium">{item.question}</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-blue-400 translate-x-0.5' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right 7 Cols: Visual Representation of Fragmented Info Converging into One Connected History */}
              <div className="lg:col-span-7 rounded-2xl bg-[#0D121D] border border-white/[0.09] p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-white/[0.08]">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                      ARCHITECTURAL CONTRAST
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-0.5">
                      From Fragmented Artifacts to Converged Evidence
                    </h3>
                  </div>

                  {/* Mode Switcher */}
                  <div className="inline-flex rounded-lg p-1 bg-[#07090E] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setProblemViewMode('fragmented')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        problemViewMode === 'fragmented'
                          ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Disconnected State
                    </button>
                    <button
                      type="button"
                      onClick={() => setProblemViewMode('connected')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        problemViewMode === 'connected'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Consecuencia Connected History
                    </button>
                  </div>
                </div>

                {/* Convergence Visual Diagram */}
                <div className="space-y-6">
                  {/* Top Row: Scattered Sources across tools & devices */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Spec Docs', sub: 'Desktop / Cloud', icon: FileText },
                      { label: 'Quick Approvals', sub: 'iPad / Mobile', icon: Tablet },
                      { label: 'Sprint Workflows', sub: 'Laptop IDE / Git', icon: Laptop },
                      { label: 'Review Queues', sub: 'Governance Tool', icon: Clock }
                    ].map((src, i) => {
                      const IconComponent = src.icon;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            problemViewMode === 'fragmented'
                              ? 'bg-[#121723] border-rose-500/20 opacity-80'
                              : 'bg-[#121829] border-blue-500/30'
                          }`}
                        >
                          <IconComponent
                            className={`w-4 h-4 mx-auto mb-1.5 ${
                              problemViewMode === 'fragmented' ? 'text-slate-400' : 'text-blue-400'
                            }`}
                          />
                          <div className="text-xs font-medium text-white">{src.label}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{src.sub}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Convergence Connector Lines */}
                  <div className="relative py-2 flex items-center justify-center">
                    {problemViewMode === 'fragmented' ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-rose-950/25 border border-dashed border-rose-500/30 text-center">
                        <span className="text-xs font-mono text-rose-300">
                          ✕ NO CAUSAL LINKAGE — Context lost between tools, devices, and handoffs
                        </span>
                      </div>
                    ) : (
                      <div className="w-full py-3 px-4 rounded-xl bg-blue-950/30 border border-blue-500/35 text-center flex items-center justify-center gap-2">
                        <GitCommit className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-mono text-blue-200">
                          CONSECUENCIA TRACEABILITY ENGINE — Normalizes &amp; links events into one causal chain
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active Question Diagnostic Output */}
                  <div className="p-5 rounded-xl bg-[#080B12] border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-400 uppercase">
                        DIAGNOSTIC QUERY 0{activeQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Project Alpha Sample
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white">
                      “{scatteredQuestions[activeQuestionIndex].question}”
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/25">
                        <div className="text-[11px] font-mono uppercase text-rose-300 mb-1 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Without Consecuencia</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {scatteredQuestions[activeQuestionIndex].silo}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-blue-950/25 border border-blue-500/30">
                        <div className="text-[11px] font-mono uppercase text-blue-300 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>With Consecuencia</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {scatteredQuestions[activeQuestionIndex].connected}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Required Closing Statement */}
                <div className="mt-6 pt-5 border-t border-white/[0.08]">
                  <p className="text-sm sm:text-base font-medium text-white">
                    The problem isn&apos;t always a lack of data.{' '}
                    <span className="text-blue-400">
                      It&apos;s the lack of a connected chain of evidence.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 6. The Solution Section (#product)                                */}
        {/* ----------------------------------------------------------------- */}
        <section id="product" className="py-20 md:py-28 border-t border-white/[0.07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                02 // THE PLATFORM ARCHITECTURE
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                One connected history. A clearer explanation.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Consecuencia connects decisions, workflows, actions, and dependencies across your organization to help you trace project outcomes back to their underlying causes.
              </p>
            </div>

            {/* 4 Core Capabilities Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 6 Cols: 4 Capability Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {capabilities.map((cap, idx) => {
                  const isSelected = activeCapabilityIndex === idx;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => setActiveCapabilityIndex(idx)}
                      className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#131C31] to-[#0D1322] border-blue-500/50 shadow-lg shadow-blue-950/30'
                          : 'bg-[#0B0F17] border-white/[0.08] hover:border-white/[0.16]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-400/25">
                            Capability {cap.number}
                          </span>
                          <ArrowUpRight
                            className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{cap.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {cap.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{cap.subtitle}</span>
                        <span className={isSelected ? 'text-blue-300' : ''}>
                          {isSelected ? 'Active View' : 'Inspect'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right 6 Cols: Deep-Dive Telemetry Inspector for Selected Capability */}
              <div className="lg:col-span-6 rounded-2xl bg-[#0B0F17] border border-white/[0.1] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-white/[0.08]">
                    <div>
                      <span className="text-xs font-mono text-blue-400 uppercase">
                        CAPABILITY {capabilities[activeCapabilityIndex].number} SPECIFICATION
                      </span>
                      <h3 className="text-xl font-semibold text-white mt-0.5">
                        {capabilities[activeCapabilityIndex].title}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                      {capabilities[activeCapabilityIndex].metricsLabel}
                    </span>
                  </div>

                  {/* Structured Fields Table */}
                  <div className="space-y-2.5 mb-6">
                    {capabilities[activeCapabilityIndex].sampleFields.map((field, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-3.5 rounded-xl bg-[#101624] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <span className="text-xs font-mono text-slate-400">{field.k}</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-100">{field.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Epistemic Distinction Callout (Recorded Fact vs Inferred Explanation) & Cross-Device Notice */}
                  <div className="p-4 rounded-xl bg-[#080B11] border border-white/[0.08] space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      <span>Architectural Safeguards</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/25">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Recorded Fact
                        </span>
                        <p className="text-xs text-slate-300 mt-1.5">
                          Immutable timestamps, authorized sign-offs, and versioned spec diffs captured from connected workplace tools.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-500/25">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          Inferred Explanation
                        </span>
                        <p className="text-xs text-slate-300 mt-1.5">
                          Causal hypotheses linking upstream changes to downstream delays—always flagged for human validation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <span>{capabilities[activeCapabilityIndex].note}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 7. How It Works (#how-it-works)                                   */}
        {/* ----------------------------------------------------------------- */}
        <section id="how-it-works" className="py-20 md:py-28 border-t border-white/[0.07] bg-[#090C14]/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                03 // OPERATIONAL WORKFLOW
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                How Consecuencia works.
              </h2>
              <p className="text-base sm:text-lg text-slate-300">
                Four structured stages move your organization from scattered workplace activity to an auditable, connected causal graph.
              </p>
            </div>

            {/* Horizontal Connected Timeline / Step Selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative mb-8">
              {howItWorksSteps.map((st, idx) => {
                const isActive = activeStepIndex === idx;
                const isPassed = idx <= activeStepIndex;
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#121A2D] border-blue-500/50 shadow-lg shadow-blue-950/30'
                        : 'bg-[#0C101A] border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                            isPassed
                              ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                              : 'bg-white/[0.04] text-slate-400 border-white/10'
                          }`}
                        >
                          {st.step}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          0{idx + 1} / 04
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{st.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {st.summary}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-blue-300">
                      <span>{st.badge}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Interactive Diagram Preview */}
            <div className="rounded-2xl bg-[#0B0F17] border border-white/[0.1] p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400">
                    <span>{howItWorksSteps[activeStepIndex].step}</span>
                    <span>—</span>
                    <span className="uppercase">{howItWorksSteps[activeStepIndex].title}</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    {howItWorksSteps[activeStepIndex].summary}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {howItWorksSteps[activeStepIndex].detail}
                  </p>
                </div>

                <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl bg-[#070A10] border border-white/[0.08] font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/[0.07] pb-2">
                    <span>SYSTEM TELEMETRY PREVIEW</span>
                    <span className="text-blue-400">{howItWorksSteps[activeStepIndex].badge}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-blue-200 leading-relaxed">
                    {howItWorksSteps[activeStepIndex].artifactPreview}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Stage {activeStepIndex + 1} of 4
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : 3))}
                        className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
                      >
                        Prev Stage
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex((prev) => (prev < 3 ? prev + 1 : 0))}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                      >
                        Next Stage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 8. Interactive Project Alpha Demonstration (#project-alpha-demo)  */}
        {/* ----------------------------------------------------------------- */}
        <section id="project-alpha-demo" className="py-20 md:py-28 border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header & Primary Interactive Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-mono uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>INTERACTIVE PRODUCT SIMULATION</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3">
                  Let&apos;s trace a project failure.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  Explore <strong className="text-white">Project Alpha</strong> below. Click any of the 8 events in the chain to inspect its timestamp, responsible role, dependencies, recorded evidence, and downstream impact—or activate{' '}
                  <strong className="text-blue-300">Trace Back to Root Cause</strong>.
                </p>
              </div>

              {/* Action Buttons: Trace Back to Root Cause & Reset */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleTriggerTraceRootCause}
                  className={`px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2.5 border transition-all cursor-pointer shadow-lg ${
                    traceRootCauseActive
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-950/50'
                      : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-blue-400/40 shadow-blue-950/50'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>
                    {traceRootCauseActive ? 'Root-Cause Trace Active (6 Nodes)' : 'Trace Back to Root Cause'}
                  </span>
                </button>

                {traceRootCauseActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setTraceRootCauseActive(false);
                      setAlphaFilter('all');
                      setSelectedAlphaEventId('alpha-1');
                    }}
                    className="px-3.5 py-3 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Root-Cause Synthesis Banner (Appears when Trace Back to Root Cause is active) */}
            {traceRootCauseActive && (
              <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-rose-950/35 to-blue-950/40 border border-amber-400/40 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Backward Causal Trace: Why Project Alpha Failed
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    ILLUSTRATIVE CAUSAL EXPLANATION · REQUIRES HUMAN VALIDATION
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-4">
                  Tracing backward from <strong className="text-rose-300">Outcome: Project Alpha fails</strong> reveals that the failure was not caused by a single isolated error on cutover day. Instead, four connected upstream events compounded across the organization:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedAlphaEventId('alpha-2')}
                    className="text-left p-3.5 rounded-xl bg-[#0B0F17]/90 border border-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-mono text-amber-300 mb-1">1. Decision 02</div>
                    <div className="text-xs font-semibold text-white mb-1">Shortened Timeline</div>
                    <p className="text-[11px] text-slate-300">
                      Delivery pulled forward by 3 weeks, compressing QA stabilization margin from 14 days to 72 hours.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAlphaEventId('alpha-4')}
                    className="text-left p-3.5 rounded-xl bg-[#0B0F17]/90 border border-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-mono text-amber-300 mb-1">2. Decision 03</div>
                    <div className="text-xs font-semibold text-white mb-1">Requirement Change</div>
                    <p className="text-[11px] text-slate-300">
                      Mid-sprint CMEK encryption mandate altered the core payload authentication contract.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAlphaEventId('alpha-5')}
                    className="text-left p-3.5 rounded-xl bg-[#0B0F17]/90 border border-blue-500/30 hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-mono text-blue-300 mb-1">3. Workflow 02</div>
                    <div className="text-xs font-semibold text-white mb-1">Outdated Assumptions</div>
                    <p className="text-[11px] text-slate-300">
                      Dependent sync teams continued building against the deprecated v1.0 schema for 18 days.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAlphaEventId('alpha-6')}
                    className="text-left p-3.5 rounded-xl bg-[#0B0F17]/90 border border-rose-500/30 hover:border-rose-400 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-mono text-rose-300 mb-1">4. Event 06 → Event 07</div>
                    <div className="text-xs font-semibold text-white mb-1">Delayed Approval &amp; Breach</div>
                    <p className="text-[11px] text-slate-300">
                      Reconciling the mismatch delayed approval by 9 days, exhausting the buffer and missing the milestone.
                    </p>
                  </button>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Note: This explanation is illustrative. In production deployments, root-cause findings depend on available organizational evidence, authorized integrations, and human review.
                  </span>
                </div>
              </div>
            )}

            {/* Main Interactive Demo Console */}
            <div className="rounded-2xl bg-[#0B0F17] border border-white/[0.1] shadow-2xl overflow-hidden">
              {/* Console Top Filter & Playback Bar */}
              <div className="px-4 sm:px-6 py-3.5 bg-[#101624] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>View:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All 8 Events' },
                    { id: 'root-cause', label: 'Root-Cause Chain (6)' },
                    { id: 'decisions', label: 'Decisions Only (3)' },
                    { id: 'workflows', label: 'Workflows & Gates (4)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAlphaFilter(tab.id as typeof alphaFilter)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                        alphaFilter === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepAlphaEvent('prev')}
                    disabled={selectedAlphaEvent.stepNumber === 1}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 text-slate-200 cursor-pointer"
                  >
                    Prev Event
                  </button>
                  <span className="text-xs font-mono text-slate-400">
                    Node 0{selectedAlphaEvent.stepNumber} / 08
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepAlphaEvent('next')}
                    disabled={selectedAlphaEvent.stepNumber === 8}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 text-slate-200 cursor-pointer"
                  >
                    Next Event
                  </button>
                </div>
              </div>

              {/* Console Body: Left Event Chain List (5 cols) + Right Detailed Inspector (7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Left Column: 8-Event Chain */}
                <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] space-y-2.5 bg-[#090D15]">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Project Alpha Event Chain</span>
                    <span>Click event to inspect</span>
                  </div>

                  {filteredAlphaEvents.map((ev) => {
                    const isSelected = ev.id === selectedAlphaEventId;
                    const isHighlightedByTrace = traceRootCauseActive && ev.isRootCauseChain;

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedAlphaEventId(ev.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#141E33] border-blue-400/60 shadow-md'
                            : isHighlightedByTrace
                            ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                            : 'bg-[#0D131F] border-white/[0.06] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                              0{ev.stepNumber}
                            </span>
                            <span className="text-xs font-mono font-semibold text-blue-300">
                              {ev.code}
                            </span>
                            {isHighlightedByTrace && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                Causal Factor
                              </span>
                            )}
                          </div>
                          <StatusBadge status={ev.status} label={ev.category} />
                        </div>

                        <div className="text-sm font-medium text-white mt-1">
                          {ev.title}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>{ev.timestamp}</span>
                          <span>{ev.deviceContext}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Comprehensive Event Inspector */}
                <div className="lg:col-span-7 p-5 sm:p-7 bg-[#0B0F17] flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Top Header of Inspector */}
                    <div className="pb-4 border-b border-white/[0.08]">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            NODE 0{selectedAlphaEvent.stepNumber} · {selectedAlphaEvent.code.toUpperCase()}
                          </span>
                          <StatusBadge status={selectedAlphaEvent.status} />
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {selectedAlphaEvent.timestamp}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-semibold text-white mt-2">
                        {selectedAlphaEvent.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                        {selectedAlphaEvent.description}
                      </p>
                    </div>

                    {/* Metadata Grid: Responsible Role, Related Decision/Workflow, Device/System */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#101624] border border-white/[0.07]">
                        <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Responsible Role
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-white">
                          {selectedAlphaEvent.responsibleRole}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#101624] border border-white/[0.07]">
                        <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Related Decision / Workflow
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-blue-300">
                          {selectedAlphaEvent.relatedItem}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#101624] border border-white/[0.07]">
                        <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Authorized Source &amp; Device
                        </div>
                        <div className="text-xs font-medium text-slate-200">
                          {selectedAlphaEvent.deviceContext}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {selectedAlphaEvent.sourceSystem}
                        </div>
                      </div>
                    </div>

                    {/* Dependencies */}
                    <div className="p-4 rounded-xl bg-[#0E1422] border border-white/[0.07]">
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                        <span>Active Dependencies</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlphaEvent.dependencies.map((dep, dIdx) => (
                          <span
                            key={dIdx}
                            className="px-3 py-1 rounded-lg text-xs font-mono bg-blue-950/50 text-blue-200 border border-blue-500/30"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recorded Evidence vs. Inferred Causal Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recorded Evidence (Fact) */}
                      <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Recorded Evidence (Fact)
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {selectedAlphaEvent.recordedEvidence.logId}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {selectedAlphaEvent.recordedEvidence.factType}
                        </div>
                        <blockquote className="text-xs font-mono text-slate-300 bg-[#070A10] p-2.5 rounded border border-white/[0.06]">
                          &ldquo;{selectedAlphaEvent.recordedEvidence.verbatimRecord}&rdquo;
                        </blockquote>
                      </div>

                      {/* Inferred Causal Note (Hypothesis) */}
                      <div className="p-4 rounded-xl bg-violet-950/15 border border-violet-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                            Inferred Causal Analysis
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Human-Validated
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {selectedAlphaEvent.inferredExplanation.confidenceNote}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedAlphaEvent.inferredExplanation.causalNote}
                        </p>
                      </div>
                    </div>

                    {/* Downstream Effects */}
                    <div className="p-4 rounded-xl bg-[#101624] border border-white/[0.07]">
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        <span>Downstream Effects</span>
                      </div>
                      <ul className="space-y-1.5">
                        {selectedAlphaEvent.downstreamEffects.map((eff, eIdx) => (
                          <li key={eIdx} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{eff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Inspector Footer Disclaimer */}
                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      Illustrative simulation: Real root-cause findings depend on available evidence and human validation.
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerTraceRootCause}
                      className="text-blue-400 hover:text-blue-300 font-mono underline cursor-pointer"
                    >
                      {traceRootCauseActive ? 'Hide Root-Cause Highlight' : 'Highlight Full Root-Cause Chain'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 9. Benefits Section                                               */}
        {/* ----------------------------------------------------------------- */}
        <section className="py-20 md:py-28 border-t border-white/[0.07] bg-[#090C14]/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                04 // ORGANIZATIONAL INTELLIGENCE
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                Turn project failures into organizational intelligence.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Move your organization from debating subjective theories to examining a structured chain of evidence—and lay the foundation for proactive risk detection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: 'Reconstruct how a project unfolded.',
                  desc: 'Assemble a coherent, chronological narrative across distributed systems, approvals, and workstreams without manual forensic digging.',
                  tag: 'Complete Timeline'
                },
                {
                  title: 'Identify critical decision points.',
                  desc: 'Pinpoint the exact charter revisions, scope trade-offs, or schedule overrides that shifted a project’s trajectory.',
                  tag: 'Decision Inflections'
                },
                {
                  title: 'Discover dependencies that amplified problems.',
                  desc: 'See how an unpropagated change in one specification rippled across downstream engineering and operational workflows.',
                  tag: 'Dependency Mapping'
                },
                {
                  title: 'Reduce time spent investigating failed initiatives.',
                  desc: 'Replace weeks of reconstructing scattered chat logs and documents with an indexed, queryable relationship graph.',
                  tag: 'Faster Post-Mortems'
                },
                {
                  title: 'Improve accountability through clear ownership and documented context.',
                  desc: 'Preserve the assumptions and constraints under which decisions were made, fostering constructive learning rather than blame.',
                  tag: 'Contextual Clarity'
                },
                {
                  title: 'Learn from past projects to make better future decisions.',
                  desc: 'Turn post-mortem findings into institutional memory so recurring structural bottlenecks are addressed before the next launch.',
                  tag: 'Institutional Memory'
                }
              ].map((b, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-[#0C111D] border border-white/[0.08] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-blue-400">0{i + 1}</span>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.07]">
                        {b.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2.5">{b.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}

              {/* 7th Benefit Full-Width Banner: Proactive Risk Detection */}
              <div className="md:col-span-2 lg:col-span-3 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#10192E] via-[#12182B] to-[#17132B] border border-blue-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>07 · FORWARD-LOOKING CAPABILITY ROADMAP</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white">
                    Identify emerging risks before they become major failures.
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    As your organization builds a structured history of project causality, Consecuencia is designed to surface early warning signals—such as compressed buffers paired with unpropagated spec changes—while there is still time to intervene.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setEarlyAccessModalOpen(true)}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-mono border border-white/15 transition-colors cursor-pointer"
                  >
                    Request Roadmap Briefing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 10. Designed for Complex Organizations (#use-cases)               */}
        {/* ----------------------------------------------------------------- */}
        <section id="use-cases" className="py-20 md:py-28 border-t border-white/[0.07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                05 // DESIGNED FOR COMPLEX ORGANIZATIONS
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                From individual decisions to organization-wide outcomes.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Events from multiple authorized workplace systems contribute to a unified project history, governed by role-based access controls tailored to every stakeholder group.
              </p>
            </div>

            {/* Stakeholder Role Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
              {STAKEHOLDER_USE_CASES.map((uc) => {
                const isSelected = uc.id === selectedUseCaseId;
                return (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => setSelectedUseCaseId(uc.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-400 text-white shadow-md'
                        : 'bg-[#0B0F17] border-white/[0.08] text-slate-300 hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="text-xs font-mono text-blue-400 mb-1">ROLE VIEW</div>
                    <div className="text-xs sm:text-sm font-semibold leading-snug">{uc.role}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Stakeholder Detail & Unified History Architecture Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-2xl bg-[#0B0F17] border border-white/[0.1] p-6 sm:p-8">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-mono">
                  <span>STAKEHOLDER PERSPECTIVE // {selectedUseCase.role.toUpperCase()}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-white leading-tight">
                  {selectedUseCase.headline}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {selectedUseCase.description}
                </p>

                <div className="pt-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                    Key Questions Answered:
                  </div>
                  <ul className="space-y-2.5">
                    {selectedUseCase.keyQuestionsAnswered.map((q, qIdx) => (
                      <li
                        key={qIdx}
                        className="p-3 rounded-xl bg-[#101624] border border-white/[0.06] text-xs sm:text-sm text-slate-200 flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Unified Project History & Access Control Diagram */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-xl bg-[#080B11] border border-white/[0.08] flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                    <span className="text-xs font-mono uppercase text-slate-300">
                      UNIFIED PROJECT HISTORY ARCHITECTURE
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      RBAC Enforced
                    </span>
                  </div>

                  {/* Multi-System Input Layer */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      1. Authorized Workplace Systems &amp; Devices
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {selectedUseCase.authorizedSources.map((src, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[#111726] border border-blue-500/25 text-center"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                          <div className="text-[11px] font-medium text-slate-200 leading-tight">
                            {src}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Device Strip */}
                    <div className="p-3 rounded-lg bg-[#0D1320] border border-white/[0.06] flex flex-wrap items-center justify-around gap-2 text-[11px] font-mono text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" /> Desktops
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-blue-400" /> Laptops
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Tablet className="w-3.5 h-3.5 text-blue-400" /> iPads
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Smartphones
                      </span>
                    </div>

                    {/* Access Control Gate */}
                    <div className="p-3.5 rounded-lg bg-blue-950/25 border border-blue-400/30">
                      <div className="text-[11px] font-mono text-blue-300 uppercase mb-1">
                        2. Role-Scoped Graph View ({selectedUseCase.role})
                      </div>
                      <div className="text-xs text-white font-medium">
                        Access Scope: {selectedUseCase.accessScope}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.07] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Permission-scoped visibility per organizational policy</span>
                  <span className="font-mono text-slate-300">Audit Log Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 11. Trust, Security, and Governance (#security)                   */}
        {/* ----------------------------------------------------------------- */}
        <section id="security" className="py-20 md:py-28 border-t border-white/[0.07] bg-[#090C14]/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14 items-end">
              <div className="lg:col-span-7">
                <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">
                  06 // TRUST, SECURITY &amp; GOVERNANCE
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                  Built for organizational learning—never covert surveillance.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  Consecuencia is architected around transparent enterprise governance, structured project events, and strict boundaries between business workflows and personal activity.
                </p>
              </div>

              <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0E1525] border border-blue-500/30">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-blue-300 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>RESPONSIBLE TRACEABILITY BOUNDARY</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Consecuencia captures authorized project artifacts—decisions, approvals, workflow transitions, and dependency updates. It is <strong className="text-white">not</strong> an employee monitoring or keystroke surveillance tool.
                </p>
              </div>
            </div>

            {/* 8 Intended Product Principles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Permission-based integrations',
                  desc: 'Connects only to workplace repositories, workflow engines, and devices explicitly authorized by workspace administrators and organizational policy.'
                },
                {
                  title: 'Role-based access controls',
                  desc: 'Scopes visibility of decision graphs, project histories, and root-cause analyses according to organizational roles and project membership.'
                },
                {
                  title: 'Auditable access to project records',
                  desc: 'Maintains a transparent record of when project timelines and root-cause reconstructions are queried, inspected, or exported.'
                },
                {
                  title: 'Data minimization',
                  desc: 'Focuses ingestion on structured project metadata, decisions, and workflow state transitions rather than extraneous communication noise.'
                },
                {
                  title: 'Configurable retention policies',
                  desc: 'Designed to let enterprises define how long historical project graphs and decision logs are retained before automated archival or purge.'
                },
                {
                  title: 'Clear distinction between project activity and personal activity',
                  desc: 'Strictly separates authorized business workflow events on managed or authorized devices from private employee applications and personal data.'
                },
                {
                  title: 'Evidence-based analysis',
                  desc: 'Every node in a causal trace links directly to its underlying source timestamp and record—eliminating unsubstantiated speculation.'
                },
                {
                  title: 'Human review of important causal conclusions',
                  desc: 'Requires human sign-off on inferred root-cause explanations so automated graph hypotheses never replace accountable leadership judgment.'
                }
              ].map((principle, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0B0F17] border border-white/[0.08] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-xs font-mono text-blue-300 mb-3.5">
                      0{idx + 1}
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{principle.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {principle.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Transparent Architecture Status Notice */}
            <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong className="text-slate-300">Governance Transparency Note:</strong> Principles above reflect Consecuencia&apos;s core product architecture design. Formal third-party compliance audits and regulatory certifications are evaluated per deployment environment.
              </span>
              <span className="font-mono text-slate-500 shrink-0">PRIVACY-FIRST ARCHITECTURE</span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 12. Final Call to Action (#early-access)                          */}
        {/* ----------------------------------------------------------------- */}
        <section id="early-access" className="py-20 md:py-28 border-t border-white/[0.08] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-b from-[#11192E] to-[#0B0F19] border border-blue-500/30 p-6 sm:p-10 lg:p-14 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left 6 Cols: Headline, Supporting Copy & Action Triggers */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-mono uppercase tracking-widest">
                    <span>EARLY ACCESS PROGRAM</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
                    When the outcome is unexpected, find the chain that led there.
                  </h2>

                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                    Connect decisions. Understand dependencies. Learn why projects succeed or fail.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('ea-name-input');
                        if (input) input.focus();
                      }}
                      className="px-6 py-3.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-950/50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Get Early Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTraceRootCauseActive(true);
                        scrollToSection('project-alpha-demo');
                      }}
                      className="px-6 py-3.5 rounded-xl font-medium text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.12] cursor-pointer"
                    >
                      Explore the Product Demo
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Designed for executive leadership, PMO, engineering, and risk teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Transparent frontend preview—no live backend submission required</span>
                    </div>
                  </div>
                </div>

                {/* Right 6 Cols: Working Early Access Signup / Configuration Form */}
                <div className="lg:col-span-6 rounded-2xl bg-[#080B12] border border-white/[0.1] p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Request Early Access</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Configure your organization&apos;s workspace preview profile
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Demo Environment
                    </span>
                  </div>

                  {!formSubmitted ? (
                    <form onSubmit={handleEarlyAccessSubmit} className="space-y-4" noValidate>
                      {formError && (
                        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="ea-name-input"
                          className="block text-xs font-mono uppercase text-slate-300 mb-1.5"
                        >
                          Full Name *
                        </label>
                        <input
                          id="ea-name-input"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Elena Rostova"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1422] border border-white/[0.12] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="ea-email-input"
                          className="block text-xs font-mono uppercase text-slate-300 mb-1.5"
                        >
                          Work Email *
                        </label>
                        <input
                          id="ea-email-input"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="elena.rostova@enterprise-org.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1422] border border-white/[0.12] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="ea-company-input"
                            className="block text-xs font-mono uppercase text-slate-300 mb-1.5"
                          >
                            Company *
                          </label>
                          <input
                            id="ea-company-input"
                            type="text"
                            required
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Vanguard Systems Inc."
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1422] border border-white/[0.12] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="ea-role-select"
                            className="block text-xs font-mono uppercase text-slate-300 mb-1.5"
                          >
                            Role
                          </label>
                          <select
                            id="ea-role-select"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1422] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-blue-400"
                          >
                            <option value="Executive Leadership (CEO / COO)">Executive Leadership (CEO / COO)</option>
                            <option value="VP of Engineering / CTO">VP of Engineering / CTO</option>
                            <option value="Program & Project Management (PMO)">Program &amp; Project Management (PMO)</option>
                            <option value="Operations & Transformation Lead">Operations &amp; Transformation Lead</option>
                            <option value="Risk, Governance & Compliance">Risk, Governance &amp; Compliance</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-md transition-all cursor-pointer mt-2"
                      >
                        Generate Early Access Configuration
                      </button>

                      <p className="text-[11px] text-slate-400 text-center">
                        Honest Demo Mode: No external backend is connected in this preview. Submitting generates a local configuration payload.
                      </p>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-400/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase text-blue-300 font-semibold">
                            DEMO CONFIGURATION STATE (NO BACKEND CONNECTED)
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          This interactive landing page runs in a client-side sandbox without a live backend server. Your request has been formatted into the local configuration payload below rather than transmitted over the network.
                        </p>
                      </div>

                      <pre className="p-3.5 rounded-xl bg-[#05070B] border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(
                          {
                            status: 'LOCAL_DEMO_STAGE_ONLY',
                            applicant: {
                              name: formData.name,
                              email: formData.email,
                              company: formData.company,
                              role: formData.role
                            }
                          },
                          null,
                          2
                        )}
                      </pre>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCopyPayload}
                          className="px-4 py-2 rounded-lg text-xs font-mono bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPayload ? 'Copied JSON Payload' : 'Copy Configuration JSON'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormSubmitted(false)}
                          className="px-4 py-2 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-white/[0.04] cursor-pointer"
                        >
                          Edit Form Fields
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* 13. Footer                                                          */}
      {/* ------------------------------------------------------------------- */}
      <footer className="border-t border-white/[0.08] bg-[#05070B] py-14 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/[0.07]">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-base font-semibold tracking-tight text-white">
                  CONSECUENCIA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Organizational intelligence, decision traceability, and root-cause analysis. Connect decisions, workflows, actions, and dependencies to understand the real story behind every project outcome.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Every failure has a chain. Find it.
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Platform
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('product')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Core Capabilities
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('project-alpha-demo')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Project Alpha Interactive Demo
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('use-cases')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Enterprise Use Cases
                  </button>
                </li>
              </ul>
            </div>

            {/* Governance & Access */}
            <div className="md:col-span-4 space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Governance &amp; Access
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('security')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Trust, Security &amp; Governance Principles
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('about')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    About the Product Vision
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setEarlyAccessModalOpen(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Request Early Access
                  </button>
                </li>
                <li className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('privacy')}
                    className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                  >
                    Privacy Notice (Placeholder)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalModalType('terms')}
                    className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                  >
                    Terms of Use (Placeholder)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Consecuencia Concept Showcase. Built as an interactive product architecture demonstration.
            </div>
            <div className="font-mono text-[11px]">
              STATUS: INTERACTIVE FRONTEND PREVIEW
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* Early Access Modal Dialog                                           */}
      {/* ------------------------------------------------------------------- */}
      {earlyAccessModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-early-access-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0C111D] border border-white/[0.12] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[11px] font-mono uppercase text-blue-400 block">
                  CONSECUENCIA WORKSPACE PREVIEW
                </span>
                <h3 id="modal-early-access-title" className="text-lg font-semibold text-white">
                  Get Early Access
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setEarlyAccessModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!formSubmitted ? (
              <form onSubmit={handleEarlyAccessSubmit} className="space-y-4" noValidate>
                {formError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                    {formError}
                  </div>
                )}

                <div>
                  <label htmlFor="modal-name" className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#080B12] border border-white/[0.12] text-sm text-white"
                  />
                </div>

                <div>
                  <label htmlFor="modal-email" className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#080B12] border border-white/[0.12] text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-company" className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Company *
                    </label>
                    <input
                      id="modal-company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Acme Enterprise"
                      className="w-full px-3.5 py-2 rounded-lg bg-[#080B12] border border-white/[0.12] text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-role" className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Role
                    </label>
                    <input
                      id="modal-role"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#080B12] border border-white/[0.12] text-sm text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEarlyAccessModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Preview Configuration State
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-400/40 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-blue-300 block mb-1">Honest Demo Configuration State:</strong>
                  No backend server is connected in this demonstration environment. Below is the structured payload generated from your input:
                </div>
                <pre className="p-3 rounded-lg bg-[#06080E] border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Modify Inputs
                  </button>
                  <button
                    type="button"
                    onClick={() => setEarlyAccessModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Legal / Privacy Placeholder Modal                                   */}
      {/* ------------------------------------------------------------------- */}
      {legalModalType && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0C111D] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-semibold text-white">
                {legalModalType === 'privacy' ? 'Privacy Policy Placeholder' : 'Terms of Service Placeholder'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              This is a transparent placeholder for the <strong>Consecuencia</strong> product concept landing page. No real legal entity, commercial terms, or personal data collection pipelines are active in this preview environment.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}