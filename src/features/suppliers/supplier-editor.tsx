"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import {
  SUPPLIER_TYPES,
  SUPPLIER_STATUSES,
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
} from "@/server/suppliers/constants";
import type { SupplierDTO } from "./types";

interface FormData {
  name: string;
  identifier: string;
  supplierType: string;
  status: string;
  description: string;
  website: string;
  taxId: string;
  industrySectors: string;
  address: string;
  city: string;
  state: string;
  country: string;
  duns: string;
  naicsCodes: string;
  riskNotes: string;
  engineeringNotes: string;
}

const DEFAULT_FORM: FormData = {
  name: "",
  identifier: "",
  supplierType: "SUPPLIER",
  status: "PENDING_REVIEW",
  description: "",
  website: "",
  taxId: "",
  industrySectors: "",
  address: "",
  city: "",
  state: "",
  country: "",
  duns: "",
  naicsCodes: "",
  riskNotes: "",
  engineeringNotes: "",
};

interface Props {
  supplier?: SupplierDTO;
}

export function SupplierEditor({ supplier }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(() => {
    if (!supplier) return DEFAULT_FORM;
    return {
      name: supplier.name,
      identifier: supplier.identifier,
      supplierType: supplier.supplierType,
      status: supplier.status,
      description: supplier.description ?? "",
      website: supplier.website ?? "",
      taxId: supplier.taxId ?? "",
      industrySectors: supplier.industrySectors?.join(", ") ?? "",
      address: supplier.locations?.[0]?.address ?? "",
      city: supplier.locations?.[0]?.city ?? "",
      state: supplier.locations?.[0]?.state ?? "",
      country: supplier.locations?.[0]?.country ?? "",
      duns: supplier.duns ?? "",
      naicsCodes: supplier.naicsCodes?.join(", ") ?? "",
      riskNotes: supplier.riskNotes ?? "",
      engineeringNotes: supplier.engineeringNotes ?? "",
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!supplier;

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    const body = {
      name: form.name,
      identifier: form.identifier,
      supplierType: form.supplierType,
      status: form.status,
      description: form.description || undefined,
      website: form.website || undefined,
      taxId: form.taxId || undefined,
      industrySectors: form.industrySectors
        ? form.industrySectors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      duns: form.duns || undefined,
      naicsCodes: form.naicsCodes
        ? form.naicsCodes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      riskNotes: form.riskNotes || undefined,
      engineeringNotes: form.engineeringNotes || undefined,
      locations:
        form.address || form.city || form.state || form.country
          ? [
              {
                name: "Primary",
                address: form.address || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                country: form.country || undefined,
              },
            ]
          : undefined,
    };

    try {
      const url = isEditing ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save supplier");
        return;
      }

      const json = await res.json();
      router.push(`/suppliers/${json.data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={6}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Supplier" : "New Supplier"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditing
                ? "Update supplier information."
                : "Register a new supplier in the system."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              <X className="mr-1.5 size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !form.name || !form.identifier}>
              {isSaving ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-4" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        {error && (
          <Panel padding="md" className="border-destructive/50">
            <p className="text-destructive text-sm">{error}</p>
          </Panel>
        )}

        <Panel padding="lg">
          <Stack gap={6}>
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              General Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Identifier *</label>
                <Input
                  value={form.identifier}
                  onChange={(e) => updateField("identifier", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Type</label>
                <select
                  value={form.supplierType}
                  onChange={(e) => updateField("supplierType", e.target.value)}
                  className="border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                >
                  {SUPPLIER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SUPPLIER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                >
                  {SUPPLIER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {SUPPLIER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Industry Sectors</label>
                <Input
                  value={form.industrySectors}
                  onChange={(e) => updateField("industrySectors", e.target.value)}
                  placeholder="e.g. Aerospace, Defense"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-foreground text-xs font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Stack>
        </Panel>

        <Panel padding="lg">
          <Stack gap={6}>
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              Contact & Address
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Address</label>
                <Input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">City</label>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">State / Province</label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Country</label>
                <Input
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Website</label>
                <Input
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>
            </div>
          </Stack>
        </Panel>

        <Panel padding="lg">
          <Stack gap={6}>
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              Business Identifiers
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">DUNS Number</label>
                <Input value={form.duns} onChange={(e) => updateField("duns", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">NAICS Codes</label>
                <Input
                  value={form.naicsCodes}
                  onChange={(e) => updateField("naicsCodes", e.target.value)}
                  placeholder="Comma separated"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Tax ID</label>
                <Input value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} />
              </div>
            </div>
          </Stack>
        </Panel>

        <Panel padding="lg">
          <Stack gap={6}>
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              Internal Notes
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Risk Notes</label>
                <Textarea
                  value={form.riskNotes}
                  onChange={(e) => updateField("riskNotes", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Engineering Notes</label>
                <Textarea
                  value={form.engineeringNotes}
                  onChange={(e) => updateField("engineeringNotes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Stack>
        </Panel>
      </Stack>
    </form>
  );
}
