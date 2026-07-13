import { NextResponse } from "next/server";
import { z } from "zod";

const timestampSchema = z.object({
  label: z.string().min(1).max(255),
  value: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

const timestamps: Array<{
  id: string;
  label: string;
  value: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}> = [];

export function GET() {
  return NextResponse.json({ data: timestamps });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = timestampSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const record = {
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: new Date(),
  };

  timestamps.push(record);

  return NextResponse.json({ data: record }, { status: 201 });
}
