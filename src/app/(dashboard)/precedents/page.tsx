"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Search,
  AlertOctagon,
  CheckCircle2,
  FileCheck2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Bookmark,
  Network,
  X,
  FileText,
  Clock,
  GitBranch,
  ShieldAlert,
  ChevronRight,
  Calendar,
  User,
  Tag,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { PageContainer, Section, Panel, GridLayout, Stack } from "@/components/layout";
import { MetricCard, LoadingSpinner, EmptyState, Button } from "@/components/ui";
import { cn } from "@/shared/utils";

interface Precedent {
  id: string;
  title: string;
  summary: string | null;
  engineeringQuestion: string | null;
  decisionMade: string | null;
  supportingEvidence: string[];
  contradictions: string[];
  missingEvidence: string[];
  outcome: string | null;
  lessonsLearned: string[];
  relatedProjects: string[];
  relatedSuppliers: string[];
  relatedRequirements: string[];
  relatedDocuments: string[];
  relatedComponents: string[];
  relatedStandards: string[];
  relatedCertifications: string[];
  decisionDate: string | null;
  decisionOwner: string | null;
  confidence: number;
  tags: string[];
  organization: string | null;
  version: number;
  sourceEntityId: string | null;
  sourceAssessmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PrecedentSearchResult {
  data: Precedent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PrecedentVersion {
  id: string;
  version: number;
  snapshot: string;
  changeDescription: string | null;
  createdById: string | null;
  createdAt: string;
}

export default function PrecedentPage() {
  const [searchResult, setSearchResult] = useState<PrecedentSearchResult | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [standardFilter, setStandardFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Detail panel state
  const [selectedPrecedent, setSelectedPrecedent] = useState<Precedent | null>(null);
  const [precedentVersions, setPrecedentVersions] = useState<PrecedentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    engineeringQuestion: "",
    decisionMade: "",
    outcome: "",
    lessonsLearned: "",
    relatedSuppliers: "",
    relatedComponents: "",
    relatedStandards: "",
    relatedCertifications: "",
    relatedProjects: "",
    relatedRequirements: "",
    relatedDocuments: "",
    supportingEvidence: "",
    contradictions: "",
    missingEvidence: "",
    decisionDate: "",
    decisionOwner: "",
    confidence: 0.95,
    tags: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (supplierFilter) params.set("supplier", supplierFilter);
    if (standardFilter) params.set("standard", standardFilter);
    if (componentFilter) params.set("component", componentFilter);
    if (ownerFilter) params.set("decisionOwner", ownerFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params.toString();
  }, [searchQuery, supplierFilter, standardFilter, componentFilter, ownerFilter, page]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/precedents?${qs}`);
      if (res.ok) {
        const result: PrecedentSearchResult = await res.json();
        setSearchResult(result);
      }
    } catch (err) {
      console.error("Failed to load precedents", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load versions when a precedent is selected
  useEffect(() => {
    if (selectedPrecedent) {
      setIsLoadingVersions(true);
      fetch(`/api/precedents/${selectedPrecedent.id}/versions`)
        .then((res) => res.ok ? res.json() : { data: [] })
        .then((json) => setPrecedentVersions(json.data ?? []))
        .catch(() => setPrecedentVersions([]))
        .finally(() => setIsLoadingVersions(false));
    } else {
      setPrecedentVersions([]);
    }
  }, [selectedPrecedent]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        summary: formData.summary || undefined,
        engineeringQuestion: formData.engineeringQuestion || undefined,
        decisionMade: formData.decisionMade || undefined,
        outcome: formData.outcome || undefined,
        confidence: formData.confidence || 0.95,
        lessonsLearned: formData.lessonsLearned ? formData.lessonsLearned.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        relatedSuppliers: formData.relatedSuppliers ? formData.relatedSuppliers.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedComponents: formData.relatedComponents ? formData.relatedComponents.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedStandards: formData.relatedStandards ? formData.relatedStandards.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedCertifications: formData.relatedCertifications ? formData.relatedCertifications.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedProjects: formData.relatedProjects ? formData.relatedProjects.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedRequirements: formData.relatedRequirements ? formData.relatedRequirements.split(",").map((s) => s.trim()).filter(Boolean) : [],
        relatedDocuments: formData.relatedDocuments ? formData.relatedDocuments.split(",").map((s) => s.trim()).filter(Boolean) : [],
        supportingEvidence: formData.supportingEvidence ? formData.supportingEvidence.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        contradictions: formData.contradictions ? formData.contradictions.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        missingEvidence: formData.missingEvidence ? formData.missingEvidence.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        decisionDate: formData.decisionDate || undefined,
        decisionOwner: formData.decisionOwner || undefined,
        tags: formData.tags ? formData.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };

      const res = await fetch("/api/precedents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormSuccess(true);
        setFormData({
          title: "", summary: "", engineeringQuestion: "", decisionMade: "", outcome: "",
          lessonsLearned: "", relatedSuppliers: "", relatedComponents: "", relatedStandards: "",
          relatedCertifications: "", relatedProjects: "", relatedRequirements: "", relatedDocuments: "",
          supportingEvidence: "", contradictions: "", missingEvidence: "",
          decisionDate: "", decisionOwner: "", confidence: 0.95, tags: "",
        });
        await loadData();
        setTimeout(() => { setIsFormOpen(false); setFormSuccess(false); }, 1200);
      } else {
        const errJson = await res.json();
        setFormError(errJson.error || "Failed to create precedent.");
      }
    } catch {
      setFormError("A network error occurred.");
    }
  };

  const precedents = searchResult?.data ?? [];
  const totalPages = searchResult?.totalPages ?? 0;
  const total = searchResult?.total ?? 0;

  return (
    <PageContainer>
      <Stack gap={8}>
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/10 text-amber-500 flex size-8 items-center justify-center rounded-md border border-amber-500/20">
                <History className="size-4" />
              </span>
              <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Historical Precedents</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Organizational memory of engineering decisions, outcomes, and lessons learned. Every decision made today becomes a precedent for tomorrow.
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 flex items-center gap-2 self-start md:self-auto rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            <span>Record Precedent</span>
          </Button>
        </div>

        {/* KPI Panel */}
        {searchResult && (
          <GridLayout columns={4} gap={4}>
            <MetricCard
              label="Total Precedents"
              value={total}
              icon={<History className="text-amber-500 size-5" />}
            />
            <MetricCard
              label="Current Page"
              value={`${page} of ${totalPages || 1}`}
              icon={<Layers className="text-blue-500 size-5" />}
            />
            <MetricCard
              label="Avg Confidence"
              value={`${precedents.length > 0 ? (precedents.reduce((a, p) => a + p.confidence, 0) / precedents.length * 100).toFixed(0) : 0}%`}
              icon={<ShieldCheck className="text-green-500 size-5" />}
            />
            <MetricCard
              label="Unique Owners"
              value={new Set(precedents.map((p) => p.decisionOwner).filter(Boolean)).size}
              icon={<User className="text-purple-500 size-5" />}
            />
          </GridLayout>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search titles, summaries, decisions..."
              className="bg-background border-border text-foreground w-full rounded-lg border py-2 pr-4 pl-10 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <input
            type="text"
            value={supplierFilter}
            onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
            placeholder="Filter by supplier..."
            className="bg-background border-border text-foreground rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring w-40"
          />
          <input
            type="text"
            value={standardFilter}
            onChange={(e) => { setStandardFilter(e.target.value); setPage(1); }}
            placeholder="Filter by standard..."
            className="bg-background border-border text-foreground rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring w-40"
          />
          <input
            type="text"
            value={ownerFilter}
            onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
            placeholder="Filter by owner..."
            className="bg-background border-border text-foreground rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring w-36"
          />
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Table */}
          <Panel padding="none" className="overflow-hidden flex-1 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner />
              </div>
            ) : precedents.length === 0 ? (
              <EmptyState
                icon={<History className="size-10 text-muted-foreground" />}
                title="No precedents found"
                description="Adjust your filters or record a new precedent."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-zinc-50 dark:bg-zinc-900/50 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">Title</th>
                        <th className="px-6 py-4 font-medium">Owner</th>
                        <th className="px-6 py-4 font-medium">Confidence</th>
                        <th className="px-6 py-4 font-medium">Version</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {precedents.map((prec) => (
                        <tr
                          key={prec.id}
                          onClick={() => setSelectedPrecedent(
                            selectedPrecedent?.id === prec.id ? null : prec,
                          )}
                          className={cn(
                            "cursor-pointer transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 group",
                            selectedPrecedent?.id === prec.id
                              ? "bg-amber-500/5 dark:bg-amber-500/5 border-l-2 border-l-amber-500"
                              : "",
                          )}
                        >
                          <td className="px-6 py-4 max-w-md">
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "font-semibold text-foreground text-sm transition-colors",
                                selectedPrecedent?.id === prec.id
                                  ? "text-amber-500"
                                  : "group-hover:text-amber-500",
                              )}>
                                {prec.title}
                              </span>
                              {prec.summary && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {prec.summary}
                                </span>
                              )}
                              {prec.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prec.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-muted-foreground px-1 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                            {prec.decisionOwner || "\u2014"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                            <span className={cn(
                              "font-semibold",
                              prec.confidence >= 0.8 ? "text-green-600 dark:text-green-400" :
                              prec.confidence >= 0.5 ? "text-amber-600 dark:text-amber-400" :
                              "text-red-600 dark:text-red-400",
                            )}>
                              {(prec.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground font-mono">
                            v{prec.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground font-mono">
                            {prec.decisionDate
                              ? new Date(prec.decisionDate).toLocaleDateString()
                              : new Date(prec.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                            {prec.supportingEvidence.length} items
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-6 py-3">
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages} ({total} total)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronsLeft className="size-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="text-xs font-mono px-2 text-foreground">{page}</span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronRightIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronsLeft className="size-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedPrecedent && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full lg:w-[460px] shrink-0 border border-border bg-background rounded-xl p-5 shadow-lg relative max-h-[80vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedPrecedent(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="text-amber-500 size-4" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                    PRECEDENT DETAIL
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    v{selectedPrecedent.version}
                  </span>
                </div>

                <h3 className="text-foreground text-base font-extrabold tracking-tight mb-2 pr-6">
                  {selectedPrecedent.title}
                </h3>

                <p className="text-muted-foreground text-xs leading-relaxed mb-4 border-b pb-4">
                  {selectedPrecedent.summary || selectedPrecedent.engineeringQuestion || "No summary provided."}
                </p>

                <div className="space-y-4">
                  {/* Engineering Question */}
                  {selectedPrecedent.engineeringQuestion && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Engineering Question
                      </span>
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-xs text-foreground">
                        {selectedPrecedent.engineeringQuestion}
                      </div>
                    </div>
                  )}

                  {/* Decision Made */}
                  {selectedPrecedent.decisionMade && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Decision Made
                      </span>
                      <p className="text-sm text-foreground">{selectedPrecedent.decisionMade}</p>
                    </div>
                  )}

                  {/* Evidence Used */}
                  {selectedPrecedent.supportingEvidence.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Evidence Used ({selectedPrecedent.supportingEvidence.length})
                      </span>
                      <div className="space-y-1">
                        {selectedPrecedent.supportingEvidence.map((ev, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground bg-zinc-50 dark:bg-zinc-900 border rounded px-2.5 py-1.5">
                            <FileText className="size-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contradictions */}
                  {selectedPrecedent.contradictions.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Contradictions ({selectedPrecedent.contradictions.length})
                      </span>
                      <div className="space-y-1">
                        {selectedPrecedent.contradictions.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-500/5 border border-red-500/10 rounded px-2.5 py-1.5">
                            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Evidence */}
                  {selectedPrecedent.missingEvidence.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Missing Evidence ({selectedPrecedent.missingEvidence.length})
                      </span>
                      <div className="space-y-1">
                        {selectedPrecedent.missingEvidence.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded px-2.5 py-1.5">
                            <XCircle className="size-3.5 shrink-0 mt-0.5" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outcome */}
                  {selectedPrecedent.outcome && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Outcome
                      </span>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-sm text-foreground">
                        {selectedPrecedent.outcome}
                      </div>
                    </div>
                  )}

                  {/* Lessons Learned */}
                  {selectedPrecedent.lessonsLearned.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Lessons Learned
                      </span>
                      <ul className="space-y-1">
                        {selectedPrecedent.lessonsLearned.map((lesson, i) => (
                          <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">&bull;</span>
                            {lesson}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Linked References */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPrecedent.relatedSuppliers.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Suppliers</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedSuppliers.map((s) => (
                            <span key={s} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPrecedent.relatedComponents.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Components</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedComponents.map((c) => (
                            <span key={c} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPrecedent.relatedStandards.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Standards</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedStandards.map((s) => (
                            <span key={s} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPrecedent.relatedCertifications.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Certifications</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedCertifications.map((c) => (
                            <span key={c} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {selectedPrecedent.relatedProjects.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Projects</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedProjects.map((p) => (
                            <span key={p} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPrecedent.relatedDocuments.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Documents</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrecedent.relatedDocuments.map((d) => (
                            <span key={d} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPrecedent.relatedRequirements.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">Requirements</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrecedent.relatedRequirements.map((r) => (
                          <span key={r} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="border-t pt-3">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-2 tracking-wider">
                      Timeline
                    </span>
                    <div className="space-y-2">
                      {selectedPrecedent.decisionDate && (
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">Decision Date:</span>
                          <span className="text-muted-foreground">
                            {new Date(selectedPrecedent.decisionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedPrecedent.decisionOwner && (
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">Decision Owner:</span>
                          <span className="text-muted-foreground">{selectedPrecedent.decisionOwner}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                        <span className="text-muted-foreground">
                          {new Date(selectedPrecedent.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">Updated:</span>
                        <span className="text-muted-foreground">
                          {new Date(selectedPrecedent.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Version History / Audit */}
                  {precedentVersions.length > 0 && (
                    <div className="border-t pt-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-2 tracking-wider">
                        Version History ({precedentVersions.length})
                      </span>
                      <div className="relative border-l pl-3 space-y-3">
                        {precedentVersions.map((v) => (
                          <div key={v.id} className="relative text-xs">
                            <div className="absolute -left-[16.5px] top-1 size-2.5 bg-amber-500 rounded-full border border-background shadow-sm" />
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">v{v.version}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(v.createdAt).toLocaleString()}
                              </span>
                              {v.changeDescription && (
                                <span className="text-muted-foreground mt-0.5">{v.changeDescription}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedPrecedent.tags.length > 0 && (
                    <div className="border-t pt-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1 tracking-wider">
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrecedent.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <Tag className="size-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Stack>

      {/* Record Precedent Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border-border w-full max-w-3xl overflow-hidden rounded-xl border p-6 shadow-xl my-8"
          >
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="text-amber-500 size-5" />
                <h2 className="text-foreground text-lg font-bold">Record Engineering Precedent</h2>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {formError && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-xs">{formError}</div>
              )}
              {formSuccess && (
                <div className="bg-green-500/5 border border-green-500/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-xs">
                  Precedent recorded successfully. Engineering memory updated.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Summary</label>
                  <textarea rows={2} value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Engineering Question</label>
                  <textarea rows={2} value={formData.engineeringQuestion} onChange={(e) => setFormData({ ...formData, engineeringQuestion: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Decision Made</label>
                  <textarea rows={2} value={formData.decisionMade} onChange={(e) => setFormData({ ...formData, decisionMade: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Outcome</label>
                  <textarea rows={2} value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-foreground text-xs font-semibold block mb-1">Lessons Learned (one per line)</label>
                  <textarea rows={3} value={formData.lessonsLearned} onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Suppliers (comma sep)</label>
                  <input type="text" value={formData.relatedSuppliers} onChange={(e) => setFormData({ ...formData, relatedSuppliers: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Components (comma sep)</label>
                  <input type="text" value={formData.relatedComponents} onChange={(e) => setFormData({ ...formData, relatedComponents: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Standards (comma sep)</label>
                  <input type="text" value={formData.relatedStandards} onChange={(e) => setFormData({ ...formData, relatedStandards: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Certifications (comma sep)</label>
                  <input type="text" value={formData.relatedCertifications} onChange={(e) => setFormData({ ...formData, relatedCertifications: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Projects (comma sep)</label>
                  <input type="text" value={formData.relatedProjects} onChange={(e) => setFormData({ ...formData, relatedProjects: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Tags (comma sep)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Decision Date</label>
                  <input type="date" value={formData.decisionDate} onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Decision Owner</label>
                  <input type="text" value={formData.decisionOwner} onChange={(e) => setFormData({ ...formData, decisionOwner: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Confidence (0-1)</label>
                  <input type="number" step="0.05" min="0" max="1" value={formData.confidence} onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Supporting Evidence (one per line)</label>
                  <textarea rows={3} value={formData.supportingEvidence} onChange={(e) => setFormData({ ...formData, supportingEvidence: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-foreground text-xs font-semibold block mb-1">Contradictions (one per line)</label>
                  <textarea rows={3} value={formData.contradictions} onChange={(e) => setFormData({ ...formData, contradictions: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-900 border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 px-5">
                  Confirm & Write
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
}
