/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  FileText,
  ChevronRight,
  Layers,
  Folder,
  AlertTriangle,
  LoaderIcon,
} from "lucide-react";
import { PageContainer, Stack } from "@/components/layout";
import { Button, Badge, Card, CardContent, Divider, Input } from "@/components/ui";

export default function DrawingsDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Project form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // New Comparison form state
  const [drawingName, setDrawingName] = useState("");
  const [revALabel, setRevALabel] = useState("Rev A");
  const [revBLabel, setRevBLabel] = useState("Rev B");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchComparisons = useCallback(async (projId: string) => {
    try {
      const cRes = await fetch(`/api/drawings/comparisons?projectId=${projId}`);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setComparisons(cJson.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const pRes = await fetch("/api/drawings/projects");
      if (pRes.ok) {
        const pJson = await pRes.json();
        setProjects(pJson.data || []);

        // Select first project by default
        if (pJson.data && pJson.data.length > 0) {
          const defaultProjId = pJson.data[0].id;
          setSelectedProjectId(defaultProjId);
          await fetchComparisons(defaultProjId);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load drawings data.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchComparisons]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle project creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/drawings/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      if (res.ok) {
        setNewProjectName("");
        setNewProjectDesc("");
        await fetchData();
      } else {
        const errJson = await res.json();
        setErrorMessage(errJson.error || "Failed to create project.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error creating project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Handle drawing upload & run comparison
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawingName || !fileA || !fileB || !selectedProjectId) {
      setErrorMessage("All fields and both files are required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("projectId", selectedProjectId);
    formData.append("drawingName", drawingName);
    formData.append("revALabel", revALabel);
    formData.append("revBLabel", revBLabel);
    formData.append("fileA", fileA);
    formData.append("fileB", fileB);

    try {
      const res = await fetch("/api/drawings/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setDrawingName("");
        setRevALabel("Rev A");
        setRevBLabel("Rev B");
        setFileA(null);
        setFileB(null);
        await fetchComparisons(selectedProjectId);
      } else {
        const errJson = await res.json();
        setErrorMessage(errJson.error || "OCR Comparison failed.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error uploading files.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <Stack gap={8}>
        {/* BRANDING */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Layers className="size-6 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight text-white">AKSCI Drawings</span>
            <Badge className="ml-2 scale-90 border-indigo-500/20 bg-indigo-500/10 font-mono text-[9px] text-indigo-400">
              MVP LIVE
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Analyze blueprint revisions, extract dimensions, and inspect mechanical differences
            deterministically.
          </p>
        </div>

        {/* ERROR BOX */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-left text-xs text-rose-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PROJECTS CONTAINER */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* COMPARISON LISTING */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  Select Project
                </span>
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      fetchComparisons(e.target.value);
                    }}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedProjectId && (
                <Button
                  onClick={() => fetchComparisons(selectedProjectId)}
                  variant="secondary"
                  size="sm"
                  className="hover:bg-zinc-80 h-8 border-zinc-800 bg-zinc-900"
                >
                  <RefreshCw className="mr-1.5 size-3" /> Refresh List
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <LoaderIcon className="size-6 animate-spin text-zinc-500" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-zinc-800 bg-zinc-900/10 py-16 text-center">
                <CardContent className="p-6">
                  <Folder className="mx-auto mb-3 size-8 text-zinc-700" />
                  <p className="text-sm font-semibold text-zinc-400">No projects yet</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create a project using the sidebar to start comparing drawing revisions.
                  </p>
                </CardContent>
              </Card>
            ) : comparisons.length === 0 ? (
              <Card className="border-dashed border-zinc-800 bg-zinc-900/10 py-16 text-center">
                <CardContent className="p-6">
                  <Folder className="mx-auto mb-3 size-8 text-zinc-700" />
                  <p className="text-sm font-semibold text-zinc-400">No drawings uploaded</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Upload Revision A and B PDF files to trigger your first comparison.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {comparisons.map((c) => (
                  <Link
                    key={c.id}
                    href={`/drawings/comparisons/${c.id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/25 p-5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-zinc-400">
                        <FileText className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-zinc-100 transition-colors group-hover:text-indigo-400">
                          Comparison ID: {c.id.substring(0, 8)}
                        </h4>
                        <span className="mt-1 text-[10px] text-zinc-500">
                          Status:{" "}
                          <span
                            className={
                              c.status === "COMPLETED"
                                ? "font-bold text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {c.status}
                          </span>{" "}
                          · Created {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 transition-colors group-hover:text-indigo-400">
                      <span className="text-xs font-semibold">Open Comparison Workspace</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* PROJECT CREATION & COMPARISON TRIGGER SIDEBAR */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Create Project Card */}
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="p-6">
                <form onSubmit={handleCreateProject}>
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                        Project Control
                      </span>
                      <h3 className="text-sm font-extrabold text-white">Create New Project</h3>
                    </div>

                    <Divider className="border-zinc-800" />

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-semibold text-zinc-400">Project Name</label>
                      <Input
                        required
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. Propulsion Flange"
                        className="h-10 border-zinc-800 bg-zinc-950 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-semibold text-zinc-400">Description</label>
                      <Input
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        placeholder="Optional description"
                        className="h-10 border-zinc-800 bg-zinc-950 text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isCreatingProject}
                      className="h-10 w-full bg-indigo-600 text-xs font-semibold tracking-wider text-white uppercase hover:bg-indigo-700"
                    >
                      {isCreatingProject ? "Creating..." : "Create Project"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>

            {/* Run Comparison Card */}
            {projects.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900/30">
                <CardContent className="p-6">
                  <form onSubmit={handleUploadSubmit}>
                    <Stack gap={6}>
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Revision Setup
                        </span>
                        <h3 className="text-sm font-extrabold text-white">
                          Compare Blueprint Sheets
                        </h3>
                      </div>

                      <Divider className="border-zinc-800" />

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-zinc-400">Drawing Name</label>
                        <Input
                          required
                          value={drawingName}
                          onChange={(e) => setDrawingName(e.target.value)}
                          placeholder="e.g. Flange Assembly"
                          className="h-10 border-zinc-800 bg-zinc-950 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Rev A Label</label>
                          <Input
                            value={revALabel}
                            onChange={(e) => setRevALabel(e.target.value)}
                            placeholder="Rev A"
                            className="h-10 border-zinc-800 bg-zinc-950 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Rev B Label</label>
                          <Input
                            value={revBLabel}
                            onChange={(e) => setRevBLabel(e.target.value)}
                            placeholder="Rev B"
                            className="h-10 border-zinc-800 bg-zinc-950 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-xs font-semibold text-zinc-400">
                          Upload Revision A (PDF)
                        </label>
                        <input
                          required
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFileA(e.target.files?.[0] || null)}
                          className="mt-1 text-xs text-zinc-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-xs font-semibold text-zinc-400">
                          Upload Revision B (PDF)
                        </label>
                        <input
                          required
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFileB(e.target.files?.[0] || null)}
                          className="mt-1 text-xs text-zinc-400"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 w-full bg-indigo-600 text-xs font-semibold tracking-wider text-white uppercase hover:bg-indigo-700"
                      >
                        {isSubmitting ? "Uploading & Comparing..." : "Initialize Analysis"}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Stack>
    </PageContainer>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}
