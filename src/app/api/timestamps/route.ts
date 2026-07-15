import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { z } from "zod";

const timestampSchema = z.object({
  label: z.string().min(1).max(255),
  value: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const timestamps = await prisma.timestamp.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: timestamps });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = timestampSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const record = await prisma.timestamp.create({
      data: {
        label: parsed.data.label,
        value: parsed.data.value,
        metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
