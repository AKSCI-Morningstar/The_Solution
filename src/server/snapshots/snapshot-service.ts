/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db";

export interface CreateSnapshotInput {
  recordId: string;
  recordType: "decision" | "failure" | "supplier_outcome" | "part" | "assessment";
  snapshotData: Record<string, any>;
  changedById?: string;
  changeDescription?: string;
}

export async function createRecordSnapshot(input: CreateSnapshotInput) {
  return prisma.recordSnapshot.create({
    data: {
      recordId: input.recordId,
      recordType: input.recordType,
      snapshotData: input.snapshotData,
      changedById: input.changedById,
      changeDescription: input.changeDescription || "Record state snapshot",
    },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getRecordSnapshots(recordId: string) {
  return prisma.recordSnapshot.findMany({
    where: { recordId },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { snapshotDate: "desc" },
  });
}

export async function getRecordSnapshotAsOf(recordId: string, asOfDate: Date) {
  const snapshot = await prisma.recordSnapshot.findFirst({
    where: {
      recordId,
      snapshotDate: { lte: asOfDate },
    },
    orderBy: { snapshotDate: "desc" },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return snapshot;
}

export async function compareSnapshots(snapshotIdA: string, snapshotIdB: string) {
  const [snapA, snapB] = await Promise.all([
    prisma.recordSnapshot.findUnique({ where: { id: snapshotIdA } }),
    prisma.recordSnapshot.findUnique({ where: { id: snapshotIdB } }),
  ]);

  if (!snapA || !snapB) {
    throw new Error("One or both snapshots were not found");
  }

  const dataA = (snapA.snapshotData as Record<string, any>) || {};
  const dataB = (snapB.snapshotData as Record<string, any>) || {};

  const allKeys = Array.from(new Set([...Object.keys(dataA), ...Object.keys(dataB)]));
  const diffs: { key: string; oldValue: any; newValue: any; isChanged: boolean }[] = [];

  for (const key of allKeys) {
    const valA = dataA[key];
    const valB = dataB[key];
    const isChanged = JSON.stringify(valA) !== JSON.stringify(valB);

    diffs.push({
      key,
      oldValue: valA,
      newValue: valB,
      isChanged,
    });
  }

  return {
    snapshotA: snapA,
    snapshotB: snapB,
    diffs,
  };
}
