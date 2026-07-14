import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PackageSearch } from "lucide-react";

export interface ExtractedEntityItem {
  id: string;
  entityType: string;
  identifier: string | null;
  name: string;
  confidence: number;
  page: number | null;
  section: string | null;
  extractionMethod: string;
}

export function ExtractionSummary({ entities }: { entities: ExtractedEntityItem[] }) {
  if (entities.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="size-10" />}
        title="No entities extracted"
        description="This document produced no matches for the current extraction rules."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Identifier</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Page</TableHead>
          <TableHead>Section</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entities.map((entity) => (
          <TableRow key={entity.id}>
            <TableCell>
              <Badge variant="secondary" size="sm">
                {entity.entityType.replaceAll("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground text-sm font-medium">
              {entity.identifier ?? entity.name}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {Math.round(entity.confidence * 100)}%
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{entity.page ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{entity.section ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
