"use client";

import Link from "next/link";
import { FileBarChart, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { ReportTypeBadge } from "./report-type-badge";

export interface ReportListItem {
  id: string;
  type: string;
  title: string;
  isFavorite: boolean;
  generatedById: string | null;
  createdAt: string;
}

export function ReportListTable({
  reports,
  onToggleFavorite,
}: {
  reports: ReportListItem[];
  onToggleFavorite: (id: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<FileBarChart className="size-10" />}
        title="No reports yet"
        description="Generate a report from the Report Builder to see it here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Generated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell className="w-8">
              <IconButton
                label={report.isFavorite ? "Unfavorite" : "Favorite"}
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(report.id)}
              >
                <Star
                  className={`size-4 ${report.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                />
              </IconButton>
            </TableCell>
            <TableCell>
              <Link
                href={`/reports/${report.id}`}
                className="text-foreground text-sm font-medium hover:underline"
              >
                {report.title}
              </Link>
            </TableCell>
            <TableCell>
              <ReportTypeBadge type={report.type} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(report.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
