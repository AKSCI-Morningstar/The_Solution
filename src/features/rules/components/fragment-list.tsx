"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { RuleCondition } from "@/server/rules/condition-types";
import { ConditionEditor } from "./condition-editor";
import { ConditionTreeViewer } from "./condition-tree-viewer";
import { defaultGroupCondition } from "./condition-defaults";

interface FragmentItem {
  id: string;
  name: string;
  description: string | null;
  condition: RuleCondition;
}

export function FragmentList() {
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<RuleCondition>(defaultGroupCondition());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/rules/fragments?page=1&pageSize=100");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setFragments(json.data);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleCreate() {
    setIsSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/rules/fragments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, condition }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.details ?? { general: [json.error ?? "Failed to create fragment"] });
        return;
      }
      setName("");
      setDescription("");
      setCondition(defaultGroupCondition());
      setShowCreate(false);
      setReloadKey((k) => k + 1);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Reusable condition fragments that rules can reference via <code>fragmentRef</code>.
        </p>
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus className="mr-1.5 size-4" />
          {showCreate ? "Cancel" : "New fragment"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New fragment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.entries(errors).map(([key, messages]) => (
              <div key={key} className="border-destructive bg-destructive/10 rounded-md border p-3">
                {messages.map((message, index) => (
                  <p key={index} className="text-destructive text-sm">
                    {message}
                  </p>
                ))}
              </div>
            ))}
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <ConditionEditor condition={condition} onChange={setCondition} fragments={fragments} />
            <Button onClick={handleCreate} disabled={isSaving || !name}>
              {isSaving ? "Saving..." : "Create fragment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading fragments...</p>
      ) : fragments.length === 0 ? (
        <EmptyState
          title="No fragments yet"
          description="Create a reusable condition fragment to reference across rules."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {fragments.map((fragment) => (
            <Card key={fragment.id}>
              <CardHeader>
                <CardTitle>{fragment.name}</CardTitle>
                {fragment.description && (
                  <p className="text-muted-foreground text-sm">{fragment.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <ConditionTreeViewer condition={fragment.condition} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
