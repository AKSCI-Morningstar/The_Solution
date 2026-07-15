"use client";

import { Award, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/shared/utils";
import { CERTIFICATION_TYPE_LABELS } from "@/server/suppliers/constants";
import type { CertificationDTO } from "./types";

interface Props {
  certifications: CertificationDTO[];
  supplierId: string;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "success",
  EXPIRING: "warning",
  EXPIRED: "destructive",
  PENDING: "secondary",
  REVOKED: "destructive",
};

export function CertificationViewer({ certifications, onAdd, onDelete }: Props) {
  return (
    <Stack gap={3}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="text-muted-foreground size-4" />
          <span className="text-foreground text-sm font-medium">Certifications</span>
          <Badge variant="secondary" size="sm">
            {certifications.length}
          </Badge>
        </div>
        {onAdd && (
          <Button variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        )}
      </div>
      {certifications.length === 0 ? (
        <Panel padding="md" className="text-muted-foreground text-center text-sm">
          No certifications recorded.
        </Panel>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Expiry</TableHead>
              {onDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {certifications.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {cert.certificationName}
                    </span>
                    {cert.issuingBody && (
                      <span className="text-muted-foreground text-xs">{cert.issuingBody}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {CERTIFICATION_TYPE_LABELS[cert.certificationType] ?? cert.certificationType}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (STATUS_BADGE[cert.status] ?? "secondary") as
                        "success" | "warning" | "destructive" | "secondary"
                    }
                    size="sm"
                  >
                    {cert.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {cert.issueDate ? (
                    <span className="text-muted-foreground text-xs">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {cert.expiryDate ? (
                    <span
                      className={cn(
                        "text-xs",
                        new Date(cert.expiryDate) < new Date()
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {new Date(cert.expiryDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <button
                      onClick={() => onDelete(cert.id)}
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
