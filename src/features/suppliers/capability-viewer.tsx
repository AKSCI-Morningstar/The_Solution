"use client";

import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import { CAPABILITY_TYPE_LABELS } from "@/server/suppliers/constants";
import type { CapabilityDTO } from "./types";

interface Props {
  capabilities: CapabilityDTO[];
  supplierId: string;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  PENDING: "warning",
  RETIRED: "secondary",
};

export function CapabilityViewer({ capabilities, onAdd, onDelete }: Props) {
  return (
    <Stack gap={3}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-muted-foreground size-4" />
          <span className="text-foreground text-sm font-medium">Capabilities</span>
          <Badge variant="secondary" size="sm">
            {capabilities.length}
          </Badge>
        </div>
        {onAdd && (
          <Button variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        )}
      </div>
      {capabilities.length === 0 ? (
        <Panel padding="md" className="text-muted-foreground text-center text-sm">
          No capabilities recorded.
        </Panel>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              {onDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {capabilities.map((cap) => (
              <TableRow key={cap.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {cap.capabilityName}
                    </span>
                    {cap.description && (
                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                        {cap.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {CAPABILITY_TYPE_LABELS[cap.capabilityType] ?? cap.capabilityType}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">{cap.category ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (STATUS_BADGE[cap.status] ?? "secondary") as
                        "success" | "warning" | "secondary"
                    }
                    size="sm"
                  >
                    {cap.status}
                  </Badge>
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <button
                      onClick={() => onDelete(cap.id)}
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
