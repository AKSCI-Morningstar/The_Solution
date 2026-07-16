"use client";

import { useState } from "react";
import { Building2, MapPin, Plus, Trash2, Users, Maximize2, CalendarDays } from "lucide-react";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import { FACILITY_TYPE_LABELS } from "@/server/suppliers/constants";
import type { FacilityDTO } from "./types";

interface Props {
  facilities: FacilityDTO[];
  supplierId: string;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}

export function FacilityExplorer({ facilities, onAdd, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Stack gap={3}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground size-4" />
          <span className="text-foreground text-sm font-medium">Facilities</span>
          <Badge variant="secondary" size="sm">
            {facilities.length}
          </Badge>
        </div>
        {onAdd && (
          <Button variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        )}
      </div>
      {facilities.length === 0 ? (
        <Panel padding="md" className="text-muted-foreground text-center text-sm">
          No facilities recorded.
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facilities.map((facility) => {
            const yearEstablished = facility.metadata?.yearEstablished as string | number | undefined;
            return (
              <Card
                key={facility.id}
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === facility.id ? null : facility.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <CardTitle className="text-sm">{facility.name}</CardTitle>
                      <span className="text-muted-foreground text-xs">
                        {FACILITY_TYPE_LABELS[facility.type] ?? facility.type}
                      </span>
                    </div>
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(facility.id);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {(facility.city || facility.country) && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <MapPin className="size-3" />
                      {[facility.city, facility.state, facility.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {expandedId === facility.id && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {facility.employees != null && (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Users className="size-3" />
                          {facility.employees} employees
                        </div>
                      )}
                      {facility.areaSqFt != null && (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Maximize2 className="size-3" />
                          {facility.areaSqFt.toLocaleString()} sq ft
                        </div>
                      )}
                      {yearEstablished != null && (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <CalendarDays className="size-3" />
                          Est. {yearEstablished}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Stack>
  );
}
