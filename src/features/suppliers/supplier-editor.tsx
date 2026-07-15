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
  supplierCode: string;
  type: string;
  status: string;
  tier: string;
  description: string;
  website: string;
  taxId: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  currency: string;
  paymentTerms: string;
  shippingTerms: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  dunsNumber: string;
  naicsCode: string;
  riskLevel: string;
  notes: string;
}

const DEFAULT_FORM: FormData = {
  name: "",
  supplierCode: "",
  type: "SUPPLIER",
  status: "PENDING_REVIEW",
  tier: "",
  description: "",
  website: "",
  taxId: "",
  industry: "",
  employeeCount: "",
  annualRevenue: "",
  currency: "USD",
  paymentTerms: "",
  shippingTerms: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  dunsNumber: "",
  naicsCode: "",
  riskLevel: "LOW",
  notes: "",
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
      supplierCode: supplier.supplierCode,
      type: supplier.type,
      status: supplier.status,
      tier: supplier.tier ?? "",
      description: supplier.description ?? "",
      website: supplier.website ?? "",
      taxId: supplier.taxId ?? "",
      industry: supplier.industry ?? "",
      employeeCount: supplier.employeeCount?.toString() ?? "",
      annualRevenue: supplier.annualRevenue ?? "",
      currency: supplier.currency ?? "USD",
      paymentTerms: supplier.paymentTerms ?? "",
      shippingTerms: supplier.shippingTerms ?? "",
      addressLine1: supplier.addressLine1 ?? "",
      addressLine2: supplier.addressLine2 ?? "",
      city: supplier.city ?? "",
      state: supplier.state ?? "",
      postalCode: supplier.postalCode ?? "",
      country: supplier.country ?? "",
      dunsNumber: supplier.dunsNumber ?? "",
      naicsCode: supplier.naicsCode ?? "",
      riskLevel: supplier.riskLevel ?? "LOW",
      notes: supplier.notes ?? "",
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
      ...form,
      employeeCount: form.employeeCount ? parseInt(form.employeeCount, 10) : undefined,
      tier: form.tier || undefined,
      description: form.description || undefined,
      website: form.website || undefined,
      taxId: form.taxId || undefined,
      industry: form.industry || undefined,
      annualRevenue: form.annualRevenue || undefined,
      currency: form.currency || undefined,
      paymentTerms: form.paymentTerms || undefined,
      shippingTerms: form.shippingTerms || undefined,
      addressLine1: form.addressLine1 || undefined,
      addressLine2: form.addressLine2 || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      postalCode: form.postalCode || undefined,
      country: form.country || undefined,
      dunsNumber: form.dunsNumber || undefined,
      naicsCode: form.naicsCode || undefined,
      riskLevel: form.riskLevel || undefined,
      notes: form.notes || undefined,
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
            <Button type="submit" disabled={isSaving || !form.name || !form.supplierCode}>
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
                <label className="text-foreground text-xs font-medium">Supplier Code *</label>
                <Input
                  value={form.supplierCode}
                  onChange={(e) => updateField("supplierCode", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
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
                <label className="text-foreground text-xs font-medium">Tier</label>
                <Input value={form.tier} onChange={(e) => updateField("tier", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Industry</label>
                <Input
                  value={form.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
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
                <label className="text-foreground text-xs font-medium">Address Line 1</label>
                <Input
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Address Line 2</label>
                <Input
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
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
                <label className="text-foreground text-xs font-medium">Postal Code</label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
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
                <Input
                  value={form.dunsNumber}
                  onChange={(e) => updateField("dunsNumber", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">NAICS Code</label>
                <Input
                  value={form.naicsCode}
                  onChange={(e) => updateField("naicsCode", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Tax ID</label>
                <Input value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Currency</label>
                <Input
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Employees</label>
                <Input
                  type="number"
                  value={form.employeeCount}
                  onChange={(e) => updateField("employeeCount", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Annual Revenue</label>
                <Input
                  value={form.annualRevenue}
                  onChange={(e) => updateField("annualRevenue", e.target.value)}
                />
              </div>
            </div>
          </Stack>
        </Panel>

        <Panel padding="lg">
          <Stack gap={6}>
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              Commercial Terms
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Payment Terms</label>
                <Input
                  value={form.paymentTerms}
                  onChange={(e) => updateField("paymentTerms", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Shipping Terms</label>
                <Input
                  value={form.shippingTerms}
                  onChange={(e) => updateField("shippingTerms", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-xs font-medium">Risk Level</label>
                <select
                  value={form.riskLevel}
                  onChange={(e) => updateField("riskLevel", e.target.value)}
                  className="border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-xs font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </Stack>
        </Panel>
      </Stack>
    </form>
  );
}
