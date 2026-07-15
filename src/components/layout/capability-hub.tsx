"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface CapabilityLink {
  label: string;
  href: string;
  description: string;
}

export interface CapabilityHubProps {
  title: string;
  description: string;
  status: "operational" | "integrated" | "deferred";
  statusLabel: string;
  icon: LucideIcon;
  links: CapabilityLink[];
  notes?: string[];
}

const statusVariant = {
  operational: "success" as const,
  integrated: "warning" as const,
  deferred: "secondary" as const,
};

export function CapabilityHub({
  title,
  description,
  status,
  statusLabel,
  icon: Icon,
  links,
  notes = [],
}: CapabilityHubProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
              <Icon className="text-foreground size-5" aria-hidden="true" />
            </div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
        </div>
        <Badge variant={statusVariant[status]}>{statusLabel}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle className="text-base">{link.label}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={link.href}>
                <Button variant="secondary">
                  Open
                  <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length > 0 && (
        <div className="border-border bg-muted/40 rounded-lg border p-4">
          <h2 className="text-foreground mb-2 text-sm font-semibold">Integration notes</h2>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
