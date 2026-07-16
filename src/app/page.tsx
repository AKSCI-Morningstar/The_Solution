import Link from "next/link";
import {
  ShieldCheck,
  GitBranch,
  BookCheck,
  AlertTriangle,
  ArrowRight,
  Workflow,
  ChevronRight,
  Database,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const pillars = [
    {
      title: "Truth Pipeline",
      description:
        "Deterministic document ingestion, metadata classification, and provenance parsing.",
      icon: Database,
      color: "text-blue-400 border-blue-500/20",
    },
    {
      title: "Knowledge Graph",
      description:
        "Traceable relationships, dependency networks, and subgraphs of engineering specs.",
      icon: GitBranch,
      color: "text-indigo-400 border-indigo-500/20",
    },
    {
      title: "Rule Engine",
      description: "Cycle detection, condition DSL evaluation, and batch topological sorting.",
      icon: BookCheck,
      color: "text-violet-400 border-violet-500/20",
    },
    {
      title: "Contradiction Engine",
      description: "Deterministic evidence conflicts and missing evidence detection.",
      icon: AlertTriangle,
      color: "text-rose-400 border-rose-500/20",
    },
    {
      title: "Reality Engine",
      description: "Reinterprets rules, contradiction lifecycles, and ingestion completeness.",
      icon: ShieldCheck,
      color: "text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Orchestrator",
      description: "Sequences calls to rule, evidence, and contradiction engines synchronously.",
      icon: Workflow,
      color: "text-cyan-400 border-cyan-500/20",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-zinc-950 font-sans text-zinc-50 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/70 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Aᴷ <span className="font-light text-zinc-400">Morningstar</span>
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="no-underline">
              <Button variant="ghost" className="text-zinc-400 transition-colors hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="no-underline">
              <Button className="bg-white font-semibold text-black shadow-md transition-all hover:bg-zinc-200">
                Register
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:py-24">
        {/* Banner Announcement */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          <span>Engineering Truth Platform v2.0 is Live</span>
          <ChevronRight className="h-3 w-3 text-zinc-500" />
        </div>

        {/* Hero Title */}
        <h1 className="max-w-3xl bg-gradient-to-r from-white via-zinc-100 to-zinc-500 bg-clip-text text-4xl leading-none font-extrabold tracking-tight text-transparent sm:text-6xl">
          The Morningstar Solution
        </h1>

        <h2 className="mt-4 max-w-2xl text-2xl font-semibold text-zinc-300 sm:text-3xl">
          Verify Engineering Truth Deterministically
        </h2>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          The Morningstar Solution is an Engineering Reality Platform that verifies structural,
          material, and logical conclusions using deterministic, traceable evidence.
          <span className="mt-2 block font-semibold text-indigo-400">
            Traditional AI predicts. We verify.
          </span>
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/dashboard" className="no-underline">
            <Button
              variant="primary"
              size="lg"
              className="flex items-center gap-2 border-0 bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a
            href="https://github.com/AKSCI-Morningstar/The_Solution.git"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <Button
              variant="secondary"
              size="lg"
              className="border border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800/50"
            >
              Documentation
            </Button>
          </a>
        </div>

        {/* Core Pillars Grid */}
        <div className="mt-20 w-full">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              The Six Verification Pillars
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Built to establish complete evidence-backed correctness.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className={`group relative rounded-xl border ${pillar.color} bg-zinc-900/20 p-6 backdrop-blur-sm transition-all hover:border-zinc-700/50 hover:bg-zinc-900/40 hover:shadow-xl hover:shadow-indigo-500/[0.02]`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all group-hover:bg-zinc-800/80 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white transition-colors group-hover:text-indigo-400">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-normal text-zinc-400">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Pillar Callout */}
        <div className="mt-20 flex w-full max-w-4xl flex-col items-center gap-6 rounded-xl border border-zinc-900 bg-gradient-to-r from-zinc-950 via-zinc-900/30 to-zinc-950 p-8 text-left md:flex-row">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-indigo-400">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">High-Consequence Integrity Assured</h3>
            <p className="mt-2 text-sm leading-normal text-zinc-400">
              Every operation within The Morningstar Solution is subject to cryptographic session
              hashing, nonce-based CSP, origin-checked CSRF validation, and granular role-based
              authorization rules. We never write placeholders or delegate verification to
              probabilistic LLMs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span>&copy; 2026 Aᴷ. All rights reserved. Proprietary and Confidential.</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/AKSCI-Morningstar/The_Solution"
              className="transition-colors hover:text-zinc-400"
            >
              GitHub
            </a>
            <span>&middot;</span>
            <span className="text-zinc-500">Enterprise Truth platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
