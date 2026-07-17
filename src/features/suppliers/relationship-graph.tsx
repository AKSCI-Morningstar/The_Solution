"use client";

import { GitBranch, Trash2 } from "lucide-react";
import {
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import { RELATIONSHIP_TYPE_LABELS } from "@/server/suppliers/constants";
import type { RelationshipDTO } from "./types";

interface Props {
  relationships: RelationshipDTO[];
  supplierId: string;
  onDelete?: (id: string) => void;
}

export function RelationshipGraph({ relationships, supplierId, onDelete }: Props) {
  return (
    <Stack gap={3}>
      <div className="flex items-center gap-2">
        <GitBranch className="text-muted-foreground size-4" />
        <span className="text-foreground text-sm font-medium">Relationships</span>
        <Badge variant="secondary" size="sm">
          {relationships.length}
        </Badge>
      </div>
      {relationships.length === 0 ? (
        <Panel padding="md" className="text-muted-foreground text-center text-sm">
          No relationships recorded.
        </Panel>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              {onDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {relationships.map((rel) => (
              <TableRow key={rel.id}>
                <TableCell>
                  <span className="text-foreground text-sm">
                    {RELATIONSHIP_TYPE_LABELS[rel.relationshipType] ?? rel.relationshipType}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" size="sm">
                    {rel.sourceSupplierId === supplierId ? "Outbound" : "Inbound"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {rel.sourceSupplierId === supplierId
                      ? (rel.targetSupplier?.name ??
                        `Supplier: ${rel.targetSupplierId.slice(0, 8)}`)
                      : (rel.sourceSupplier?.name ??
                        `Supplier: ${rel.sourceSupplierId.slice(0, 8)}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" size="sm">
                    Active
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {rel.startDate ? new Date(rel.startDate).toLocaleDateString() : "—"}
                  </span>
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <button
                      onClick={() => onDelete(rel.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
