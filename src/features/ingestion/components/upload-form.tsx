"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/ingestion/documents", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        setError(err.error ?? "Failed to upload document");
        return;
      }
      const { data: document } = await uploadRes.json();

      const jobRes = await fetch("/api/ingestion/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id }),
      });
      if (!jobRes.ok) {
        const err = await jobRes.json();
        setError(err.error ?? "Document uploaded, but failed to start ingestion");
        return;
      }
      const { data: job } = await jobRes.json();
      router.push(`/ingestion/${job.id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}
          <label
            htmlFor="ingestion-file"
            className="border-border text-muted-foreground hover:bg-surface-hover flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm"
          >
            <UploadCloud className="size-8" />
            {file ? (
              <span className="text-foreground font-medium">{file.name}</span>
            ) : (
              <span>
                Click to choose any document (PDF, CAD STEP/DXF, CSV, XLSX, DOCX, TXT, JSON, images,
                etc.)
              </span>
            )}
            <input
              id="ingestion-file"
              type="file"
              accept="*/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !file}>
              {isPending ? "Uploading..." : "Upload and start ingestion"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
