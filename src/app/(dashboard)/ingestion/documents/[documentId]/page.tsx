"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { JobStatusBadge } from "@/features/ingestion/components";

interface DocumentDetail {
  id: string;
  fileName: string;
  fileExtension: string;
  sizeBytes: number;
  currentVersion: number;
  status: string;
  createdAt: string;
  versions: {
    id: string;
    version: number;
    fileName: string;
    sizeBytes: number;
    createdAt: string;
  }[];
  jobs: { id: string; status: string; documentType: string | null; createdAt: string }[];
}

export default function IngestionDocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ingestion/documents/${params.documentId}`);
        if (res.ok) {
          const { data } = await res.json();
          if (!cancelled) setDocument(data);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.documentId]);

  async function handleReprocess() {
    setIsReprocessing(true);
    try {
      const res = await fetch(`/api/ingestion/documents/${params.documentId}/reprocess`, {
        method: "POST",
      });
      if (res.ok) {
        const { data: job } = await res.json();
        router.push(`/ingestion/${job.id}`);
      }
    } finally {
      setIsReprocessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-muted-foreground text-sm">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/ingestion")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              {document.fileName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {(document.sizeBytes / 1024).toFixed(1)} KB · current version v
              {document.currentVersion}
            </p>
          </div>
        </div>
        <Button onClick={handleReprocess} disabled={isReprocessing}>
          <RefreshCw className="mr-1.5 size-4" />
          {isReprocessing ? "Starting..." : "Reprocess"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-foreground mb-4 text-sm font-semibold">Version history</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>File name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {document.versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>v{version.version}</TableCell>
                  <TableCell className="text-foreground text-sm">{version.fileName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {(version.sizeBytes / 1024).toFixed(1)} KB
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(version.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-foreground mb-4 text-sm font-semibold">Ingestion jobs</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Document type</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {document.jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/ingestion/${job.id}`} className="hover:underline">
                      <JobStatusBadge status={job.status} />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {job.documentType?.replaceAll("_", " ") ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
