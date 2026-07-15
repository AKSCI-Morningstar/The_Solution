"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  REPORT_TYPES,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_LABELS,
  type ReportType,
} from "@/server/reporting/constants";

const TYPE_OPTIONS = REPORT_TYPES.map((t) => ({ value: t, label: REPORT_TYPE_LABELS[t] }));

export function ReportBuilderForm() {
  const router = useRouter();
  const [type, setType] = useState<ReportType>("EXECUTIVE");
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reporting/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim() || undefined,
          filters: {
            from: from || undefined,
            to: to || undefined,
            entityType: entityType || undefined,
            search: search || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to generate report");
        setIsSubmitting(false);
        return;
      }
      router.push(`/reports/${json.data.id}`);
    } catch {
      setError("Failed to generate report");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="type" className="text-foreground text-sm font-medium">
          Report type
        </label>
        <Select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as ReportType)}
          options={TYPE_OPTIONS}
        />
        <p className="text-muted-foreground text-xs">{REPORT_TYPE_DESCRIPTIONS[type]}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-foreground text-sm font-medium">
          Title (optional)
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={REPORT_TYPE_LABELS[type]}
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="from" className="text-foreground text-sm font-medium">
              From
            </label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="to" className="text-foreground text-sm font-medium">
              To
            </label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entityType" className="text-foreground text-sm font-medium">
              Entity type filter (optional)
            </label>
            <Input
              id="entityType"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g. COMPONENT"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search" className="text-foreground text-sm font-medium">
              Search (optional)
            </label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Text to match"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate report"}
      </Button>
    </form>
  );
}
