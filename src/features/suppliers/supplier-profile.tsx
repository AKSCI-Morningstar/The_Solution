"use client";

import { Building2, MapPin, Globe, ExternalLink } from "lucide-react";
import { Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import { SUPPLIER_TYPE_LABELS, SUPPLIER_STATUS_LABELS } from "@/server/suppliers/constants";
import type { SupplierDTO } from "./types";
import { CertificationViewer } from "./certification-viewer";
import { CapabilityViewer } from "./capability-viewer";
import { FacilityExplorer } from "./facility-explorer";
import { ContactList } from "./contact-list";
import { RelationshipGraph } from "./relationship-graph";

interface Props {
  supplier: SupplierDTO;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "success",
  APPROVED: "success",
  PENDING_REVIEW: "warning",
  INACTIVE: "secondary",
  DISQUALIFIED: "destructive",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function SupplierProfile({ supplier }: Props) {
  return (
    <Stack gap={6}>
      <div className="flex items-start gap-4">
        <div className="bg-muted flex size-14 items-center justify-center rounded-xl">
          <Building2 className="text-muted-foreground size-7" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{supplier.name}</h1>
            <Badge
              variant={
                (STATUS_BADGE[supplier.status] ?? "secondary") as
                  "success" | "warning" | "secondary" | "destructive"
              }
            >
              {SUPPLIER_STATUS_LABELS[supplier.status] ?? supplier.status}
            </Badge>
            <Badge variant="secondary">
              {SUPPLIER_TYPE_LABELS[supplier.supplierType] ?? supplier.supplierType}
            </Badge>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{supplier.identifier}</code>
            {supplier.industrySectors?.[0] && <span>{supplier.industrySectors[0]}</span>}
            {(supplier.locations?.[0]?.city || supplier.locations?.[0]?.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {[
                  supplier.locations[0].city,
                  supplier.locations[0].state,
                  supplier.locations[0].country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {supplier.description && (
            <Panel padding="md">
              <p className="text-foreground text-sm">{supplier.description}</p>
            </Panel>
          )}

          <Panel padding="md">
            <CertificationViewer
              certifications={supplier.certifications ?? []}
              supplierId={supplier.id}
            />
          </Panel>

          <Panel padding="md">
            <CapabilityViewer capabilities={supplier.capabilities ?? []} supplierId={supplier.id} />
          </Panel>

          <Panel padding="md">
            <FacilityExplorer facilities={supplier.facilities ?? []} supplierId={supplier.id} />
          </Panel>

          <Panel padding="md">
            <ContactList contacts={supplier.contacts ?? []} supplierId={supplier.id} />
          </Panel>

          <Panel padding="md">
            <RelationshipGraph
              relationships={[
                ...(supplier.outgoingRelationships ?? []),
                ...(supplier.incomingRelationships ?? []),
              ]}
              supplierId={supplier.id}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">DUNS</span>
                  <span className="text-foreground text-xs">{supplier.duns ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">NAICS</span>
                  <span className="text-foreground text-xs">
                    {supplier.naicsCodes?.join(", ") ?? "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {supplier.riskNotes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                      Risk Notes
                    </span>
                    <span className="text-foreground text-xs">{supplier.riskNotes}</span>
                  </div>
                )}
                {supplier.engineeringNotes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                      Engineering Notes
                    </span>
                    <span className="text-foreground text-xs">{supplier.engineeringNotes}</span>
                  </div>
                )}
                {!supplier.riskNotes && !supplier.engineeringNotes && (
                  <span className="text-muted-foreground text-sm">No notes available.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {supplier.website && (
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-surface-hover text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
            >
              <Globe className="size-4" />
              Website
              <ExternalLink className="ml-auto size-3.5" />
            </a>
          )}

          <div className="text-muted-foreground flex flex-col gap-1 text-xs">
            <span>Created {timeAgo(supplier.createdAt)}</span>
            <span>Updated {timeAgo(supplier.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Stack>
  );
}
