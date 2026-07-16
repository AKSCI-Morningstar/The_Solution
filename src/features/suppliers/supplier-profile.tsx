"use client";

import { useState } from "react";
import { Building2, MapPin, Globe, ExternalLink, Edit } from "lucide-react";
import { cn } from "@/shared/utils";
import { Badge, Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import { SUPPLIER_TYPE_LABELS, SUPPLIER_STATUS_LABELS } from "@/server/suppliers/constants";
import type { SupplierDTO } from "./types";
import { CertificationViewer } from "./certification-viewer";
import { CapabilityViewer } from "./capability-viewer";
import { FacilityExplorer } from "./facility-explorer";
import { ContactList } from "./contact-list";
import { RelationshipGraph } from "./relationship-graph";
import { SupplierEditor } from "./supplier-editor";

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

function RatingBar({
  label,
  value,
  color,
}: {
  label: string;
  value?: number | null;
  color: string;
}) {
  if (value == null) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className={cn("text-xs font-medium", color)}>{value.toFixed(1)}</span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", color.replace("text-", "bg-"))}
          style={{ width: `${Math.min(value * 20, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function SupplierProfile({ supplier: initialSupplier }: Props) {
  const [supplier, setSupplier] = useState<SupplierDTO>(initialSupplier);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <SupplierEditor
        supplier={supplier}
        onCancel={() => setIsEditing(false)}
        onSuccess={(updatedSupplier) => {
          setSupplier(updatedSupplier);
          setIsEditing(false);
        }}
      />
    );
  }

  // Combine outgoing and incoming relationships for ease of display in RelationshipGraph
  const relationships = [
    ...(supplier.outgoingRelationships ?? []).map((rel) => ({
      ...rel,
      direction: "OUTBOUND" as const,
      relatedSupplier: rel.targetSupplier,
    })),
    ...(supplier.incomingRelationships ?? []).map((rel) => ({
      ...rel,
      direction: "INBOUND" as const,
      relatedSupplier: rel.sourceSupplier,
    })),
  ];

  return (
    <Stack gap={6}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-muted flex size-14 items-center justify-center rounded-xl">
            <Building2 className="text-muted-foreground size-7" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
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
              {supplier.tier && <span>Tier {supplier.tier}</span>}
              {supplier.industrySectors && supplier.industrySectors.length > 0 && (
                <span>{supplier.industrySectors.join(", ")}</span>
              )}
              {(supplier.city || supplier.country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditing(true)} size="sm" variant="secondary" className="shrink-0">
          <Edit className="mr-1.5 size-4" />
          Edit
        </Button>
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
              relationships={relationships}
              supplierId={supplier.id}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap={3}>
                <RatingBar label="Quality" value={supplier.qualityRating} color="text-success" />
                <RatingBar label="Delivery" value={supplier.deliveryRating} color="text-primary" />
                <RatingBar label="Cost" value={supplier.costRating} color="text-warning" />
                <RatingBar label="Compliance" value={supplier.complianceRating} color="text-info" />
                {supplier.overallRating != null && (
                  <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
                    <span className="text-foreground text-xs font-medium">Overall</span>
                    <span className="text-lg font-bold">{supplier.overallRating.toFixed(1)}</span>
                  </div>
                )}
              </Stack>
            </CardContent>
          </Card>

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
                    {supplier.naicsCodes && supplier.naicsCodes.length > 0
                      ? supplier.naicsCodes.join(", ")
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Payment Terms</span>
                  <span className="text-foreground text-xs">{supplier.paymentTerms ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Shipping Terms</span>
                  <span className="text-foreground text-xs">{supplier.shippingTerms ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Lead Time</span>
                  <span className="text-foreground text-xs">
                    {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Employees</span>
                  <span className="text-foreground text-xs">
                    {supplier.employeeCount?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Risk Level</span>
                  <Badge
                    variant={
                      (supplier.riskLevel === "HIGH" || supplier.riskLevel === "CRITICAL"
                        ? "destructive"
                        : supplier.riskLevel === "MEDIUM"
                          ? "warning"
                          : "success") as "destructive" | "warning" | "success"
                    }
                    size="sm"
                  >
                    {supplier.riskLevel ?? "Unknown"}
                  </Badge>
                </div>
                {supplier.riskScore != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Risk Score</span>
                    <span className="text-foreground text-xs">{supplier.riskScore.toFixed(1)}</span>
                  </div>
                )}
                {supplier.lastAssessmentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Last Assessment</span>
                    <span className="text-foreground text-xs">
                      {new Date(supplier.lastAssessmentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {supplier.nextAssessmentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Next Assessment</span>
                    <span className="text-foreground text-xs">
                      {new Date(supplier.nextAssessmentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Start</span>
                  <span className="text-foreground text-xs">
                    {supplier.contractStartDate
                      ? new Date(supplier.contractStartDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">End</span>
                  <span className="text-foreground text-xs">
                    {supplier.contractEndDate
                      ? new Date(supplier.contractEndDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Value</span>
                  <span className="text-foreground text-xs">
                    {supplier.contractValue
                      ? `${supplier.currency ?? "USD"} ${supplier.contractValue.toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Onboarded</span>
                  <span className="text-foreground text-xs">
                    {supplier.createdAt
                      ? new Date(supplier.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {supplier.website && (
            <a
              href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
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
