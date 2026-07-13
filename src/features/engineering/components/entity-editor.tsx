"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface EntityEditorProps {
  initialData?: {
    id: string;
    identifier: string;
    name: string;
    description: string | null;
    entityType: string;
    status: string;
  };
  onSuccess?: () => void;
}

export function EntityEditor({ initialData, onSuccess }: EntityEditorProps) {
  const router = useRouter();
  const [entityType, setEntityType] = useState(initialData?.entityType ?? "COMPONENT");
  const [identifier, setIdentifier] = useState(initialData?.identifier ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch("/api/engineering/types")
      .then((res) => (res.ok ? res.json() : { data: { entityTypes: [] } }))
      .then((json) => setTypes(json.data?.entityTypes ?? []))
      .catch(() => {});
  }, []);

  const isEditing = !!initialData;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing
        ? `/api/engineering/entities/${initialData.id}`
        : "/api/engineering/entities";
      const body: Record<string, unknown> = { name, description: description || null };

      if (status && isEditing) {
        body.status = status;
      }

      if (!isEditing) {
        body.entityType = entityType;
        body.identifier = identifier;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save");
        return;
      }

      if (onSuccess) {
        onSuccess();
        return;
      }
      const json = await res.json();
      router.push(`/entities/${json.data.id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
      )}

      {!isEditing && (
        <Select
          label="Entity type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          options={types}
          required
        />
      )}

      {!isEditing && (
        <Input
          label="Identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
          placeholder="e.g. COMP-001"
          required
        />
      )}

      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      {isEditing && (
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "ACTIVE", label: "Active" },
            { value: "PENDING_REVIEW", label: "Pending Review" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
            { value: "SUPERSEDED", label: "Superseded" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Create entity"}
        </Button>
      </div>
    </form>
  );
}
