"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { FileStack } from "lucide-react";
import { JobStatusBadge } from "./job-status-badge";

export interface JobListItem {
  id: string;
  status: string;
  documentType: string | null;
  progressPercent: number;
  createdAt: string;
  document: { fileName: string; fileExtension: string };
  _count: {
    extractedEntities: number;
    extractedRelationships: number;
    extractedReferences: number;
  };
}

export function JobHistoryTable({ jobs }: { jobs: JobListItem[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<FileStack className="size-10" />}
        title="No ingestion jobs yet"
        description="Upload a document to run it through the ingestion pipeline."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Entities</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/ingestion/${job.id}`} className="hover:underline">
                <span className="text-foreground font-medium">{job.document.fileName}</span>
                <span className="text-muted-foreground ml-2 text-xs uppercase">
                  {job.document.fileExtension}
                </span>
              </Link>
            </TableCell>
            <TableCell>
              <JobStatusBadge status={job.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{job.progressPercent}%</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {job._count.extractedEntities}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(job.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
