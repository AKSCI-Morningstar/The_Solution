"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface CandidateRule {
  id: string;
  name: string;
  category: string;
  status: string;
}

export interface DependencySelectorProps {
  excludeRuleId?: string;
  selected: string[];
  onChange: (next: string[]) => void;
}

export function DependencySelector({ excludeRuleId, selected, onChange }: DependencySelectorProps) {
  const [candidates, setCandidates] = useState<CandidateRule[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "200" });
        const res = await fetch(`/api/rules?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setCandidates(
              (json.data as CandidateRule[]).filter((rule) => rule.id !== excludeRuleId),
            );
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [excludeRuleId]);

  const filtered = candidates.filter((rule) =>
    rule.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(ruleId: string) {
    if (selected.includes(ruleId)) {
      onChange(selected.filter((id) => id !== ruleId));
    } else {
      onChange([...selected, ruleId]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Search rules to depend on..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="border-border max-h-56 overflow-y-auto rounded-md border">
        {isLoading ? (
          <p className="text-muted-foreground p-3 text-sm">Loading rules...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">No rules found.</p>
        ) : (
          <div className="divide-border divide-y">
            {filtered.map((rule) => (
              <div
                key={rule.id}
                className="hover:bg-surface-hover flex items-center gap-2 px-3 py-2"
              >
                <Checkbox
                  checked={selected.includes(rule.id)}
                  onChange={() => toggle(rule.id)}
                  label={rule.name}
                />
                <span className="text-muted-foreground text-xs">{rule.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {selected.length} dependency{selected.length !== 1 ? "ies" : "y"} selected
        </p>
      )}
    </div>
  );
}
