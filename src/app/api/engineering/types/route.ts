import { NextResponse } from "next/server";
import {
  ENTITY_TYPES,
  ENTITY_STATUSES,
  RELATIONSHIP_TYPES,
  ENTITY_TYPE_LABELS,
  STATUS_LABELS,
  RELATIONSHIP_TYPE_LABELS,
} from "@/server/engineering/constants";

export async function GET() {
  return NextResponse.json({
    data: {
      entityTypes: ENTITY_TYPES.map((t) => ({ value: t, label: ENTITY_TYPE_LABELS[t] ?? t })),
      statuses: ENTITY_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s })),
      relationshipTypes: RELATIONSHIP_TYPES.map((r) => ({
        value: r,
        label: RELATIONSHIP_TYPE_LABELS[r] ?? r,
      })),
    },
  });
}
