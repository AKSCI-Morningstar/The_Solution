"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldQuestion } from "lucide-react";
import { RuleSeverityBadge, RuleStatusBadge } from "./rule-status-badge";

export interface RuleListItem {
  id: string;
  name: string;
  category: string;
  severity: string;
  status: string;
  priority: number;
  updatedAt: string;
  _count: { dependsOn: number; dependents: number; executionResults: number };
}

export function RuleListTable({ rules }: { rules: RuleListItem[] }) {
  if (rules.length === 0) {
    return (
      <EmptyState
        icon={<ShieldQuestion className="size-10" />}
        title="No rules yet"
        description="Create a rule to start evaluating your engineering data deterministically."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Executions</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>
              <Link
                href={`/rules/${rule.id}`}
                className="text-foreground text-sm font-medium hover:underline"
              >
                {rule.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {rule.category.replaceAll("_", " ")}
            </TableCell>
            <TableCell>
              <RuleSeverityBadge severity={rule.severity} />
            </TableCell>
            <TableCell>
              <RuleStatusBadge status={rule.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{rule.priority}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {rule._count.executionResults}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(rule.updatedAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
