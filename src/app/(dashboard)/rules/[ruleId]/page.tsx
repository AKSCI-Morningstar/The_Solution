"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConditionTreeViewer,
  DependencyViewer,
  ExecutionResultsList,
  RuleSeverityBadge,
  RuleStatusBadge,
} from "@/features/rules/components";
import type { RuleCondition } from "@/server/rules/condition-types";

interface RuleDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: number;
  severity: string;
  status: string;
  version: number;
  tags: string[] | null;
  conditionRoot: RuleCondition;
  scope: { entityType: string; filter?: RuleCondition };
  updatedAt: string;
}

interface DependencyRuleRef {
  id: string;
  name: string;
  status: string;
  category: string;
}

export default function RuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const router = useRouter();
  const [rule, setRule] = useState<RuleDetail | null>(null);
  const [dependencies, setDependencies] = useState<{
    upstream: DependencyRuleRef[];
    downstream: DependencyRuleRef[];
  }>({
    upstream: [],
    downstream: [],
  });
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ruleRes, depsRes] = await Promise.all([
          fetch(`/api/rules/${ruleId}`),
          fetch(`/api/rules/${ruleId}/dependencies`),
        ]);
        const ruleJson = await ruleRes.json();
        if (!ruleRes.ok) {
          if (!cancelled) setError(ruleJson.error ?? "Failed to load rule");
          return;
        }
        if (!cancelled) setRule(ruleJson.data);
        if (depsRes.ok) {
          const depsJson = await depsRes.json();
          if (!cancelled) setDependencies(depsJson.data);
        }
      } catch {
        if (!cancelled) setError("Failed to load rule");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ruleId, reloadKey]);

  async function handleExecute() {
    setIsActing(true);
    setActionMessage("");
    try {
      const res = await fetch(`/api/rules/${ruleId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMessage(json.error ?? "Execution failed");
        return;
      }
      setActionMessage(
        `Evaluated ${json.data.length} subject entit${json.data.length === 1 ? "y" : "ies"}.`,
      );
      setTab("executions");
    } finally {
      setIsActing(false);
    }
  }

  async function handlePublish() {
    setIsActing(true);
    setActionMessage("");
    try {
      const res = await fetch(`/api/rules/${ruleId}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setActionMessage(json.error ?? "Publish failed");
        return;
      }
      setReloadKey((k) => k + 1);
      setActionMessage("Rule published.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
    if (res.ok) router.push("/rules");
    else {
      const json = await res.json();
      setActionMessage(json.error ?? "Delete failed");
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <p className="text-muted-foreground text-sm">Loading rule...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">{rule.name}</h1>
            <RuleStatusBadge status={rule.status} />
            <RuleSeverityBadge severity={rule.severity} />
          </div>
          <p className="text-muted-foreground text-sm">
            {rule.category.replaceAll("_", " ")} - v{rule.version}
          </p>
          {rule.description && (
            <p className="text-muted-foreground max-w-2xl text-sm">{rule.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push(`/rules/${rule.id}/edit`)}>
            Edit
          </Button>
          <Button onClick={handleExecute} disabled={isActing}>
            Execute
          </Button>
          {rule.status === "DRAFT" && (
            <Button variant="secondary" onClick={handlePublish} disabled={isActing}>
              Publish
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={isActing}>
            Delete
          </Button>
        </div>
      </div>

      {actionMessage && <p className="text-muted-foreground text-sm">{actionMessage}</p>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border-border flex gap-4 border-b">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="dependencies"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Dependencies
          </TabsTrigger>
          <TabsTrigger
            value="executions"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Execution Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Scope</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm">
                Applies to entities of type <code className="text-xs">{rule.scope.entityType}</code>
              </p>
              {rule.scope.filter && (
                <>
                  <p className="text-muted-foreground text-xs">Filter:</p>
                  <ConditionTreeViewer condition={rule.scope.filter} />
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <ConditionTreeViewer condition={rule.conditionRoot} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="mt-6">
          <DependencyViewer upstream={dependencies.upstream} downstream={dependencies.downstream} />
        </TabsContent>

        <TabsContent value="executions" className="mt-6">
          <ExecutionResultsList ruleId={rule.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
