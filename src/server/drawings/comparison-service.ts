import { prisma } from "@/server/db";
import { parseDrawingPdf } from "./pdf-parser";
import { uploadDrawingFile } from "./storage";

export async function processDrawingUpload(
  _projectId: string,
  drawingId: string,
  revisionLabel: string,
  fileName: string,
  fileBuffer: Buffer,
  userId: string,
) {
  // 1. Upload file to storage
  const { fileUrl, fileKey } = await uploadDrawingFile(fileName, fileBuffer);

  // 2. Extract information from PDF
  let parseResult;
  try {
    parseResult = await parseDrawingPdf(fileBuffer);
  } catch (err) {
    console.error("PDF Parsing failed:", err);
    throw new Error("OCR could not detect text.");
  }

  // 3. Save Revision in Database
  const revision = await prisma.drawingRevision.create({
    data: {
      drawingId,
      revisionLabel,
      fileUrl,
      fileKey,
      title: parseResult.title,
      drawingNumber: parseResult.drawingNumber,
      material: parseResult.material,
      dimensionsJson: JSON.stringify(parseResult.dimensions),
      notesJson: JSON.stringify(parseResult.notes),
      revHistoryJson: JSON.stringify(parseResult.revHistory),
      uploadedById: userId,
    },
  });

  return revision;
}

export async function runDrawingComparison(projectId: string, revAId: string, revBId: string) {
  // Create Job
  const job = await prisma.drawingComparisonJob.create({
    data: {
      projectId,
      revAId,
      revBId,
      status: "PROCESSING",
      progress: 10,
    },
  });

  try {
    const revA = await prisma.drawingRevision.findUnique({ where: { id: revAId } });
    const revB = await prisma.drawingRevision.findUnique({ where: { id: revBId } });

    if (!revA || !revB) {
      throw new Error("Revisions not found.");
    }

    const dimsA: string[] = JSON.parse(revA.dimensionsJson || "[]");
    const dimsB: string[] = JSON.parse(revB.dimensionsJson || "[]");

    const notesA: string[] = JSON.parse(revA.notesJson || "[]");
    const notesB: string[] = JSON.parse(revB.notesJson || "[]");

    const changes: Array<{
      changeType: string;
      actionType: string;
      category: string;
      description: string;
      oldValue?: string;
      newValue?: string;
      boundingBox?: string;
      manufacturingImpact?: string;
      qualityImpact?: string;
    }> = [];

    // Compare Dimensions
    // Check for removed dimensions
    for (const d of dimsA) {
      if (!dimsB.includes(d)) {
        // Try to find if it was modified (e.g. same base dimension but different tolerance)
        const baseA = d.split("±")[0].trim();
        const matchB = dimsB.find((db) => db.split("±")[0].trim() === baseA);

        if (matchB) {
          changes.push({
            changeType: "DIMENSION",
            actionType: "CHANGED",
            category: "Dimension Modified",
            description: `Dimension value or tolerance updated for ${baseA}.`,
            oldValue: d,
            newValue: matchB,
            boundingBox: JSON.stringify({ x: 220, y: 310, w: 90, h: 45 }), // Seed coordinates
            manufacturingImpact: `Tolerance changed. Fits must be re-calibrated. Inspection frequency must match updated tolerance thresholds.`,
            qualityImpact: `Perform micrometer verification. Verify Cpk index remains above critical control limit.`,
          });
        } else {
          changes.push({
            changeType: "DIMENSION",
            actionType: "REMOVED",
            category: "Dimension Removed",
            description: `Dimension callout removed from drawing: ${d}`,
            oldValue: d,
            newValue: undefined,
            boundingBox: JSON.stringify({ x: 610, y: 250, w: 60, h: 60 }),
            manufacturingImpact:
              "Cycle time check. Verify feature is no longer critical for assembly matching.",
            qualityImpact: "Inspection parameter removed from control plan.",
          });
        }
      }
    }

    // Check for added dimensions
    for (const d of dimsB) {
      const baseB = d.split("±")[0].trim();
      const matchA = dimsA.find((da) => da.split("±")[0].trim() === baseB);
      if (!dimsA.includes(d) && !matchA) {
        changes.push({
          changeType: "DIMENSION",
          actionType: "ADDED",
          category: "Dimension Added",
          description: `New dimension callout added: ${d}`,
          oldValue: undefined,
          newValue: d,
          boundingBox: JSON.stringify({ x: 310, y: 440, w: 75, h: 40 }),
          manufacturingImpact:
            "New setup measurement required. Calibrate machine reference coordinates.",
          qualityImpact: "Add dimension check to inspection checklist.",
        });
      }
    }

    // Compare Notes
    for (const n of notesA) {
      if (!notesB.includes(n)) {
        changes.push({
          changeType: "NOTE",
          actionType: "REMOVED",
          category: "Note Removed",
          description: `Drawing note removed: ${n}`,
          oldValue: n,
          newValue: undefined,
          boundingBox: JSON.stringify({ x: 50, y: 700, w: 250, h: 60 }),
          manufacturingImpact:
            "Ensure process adjustments are logged if deburring or coating notes were removed.",
          qualityImpact: "Verify note removal conforms to design authority instruction.",
        });
      }
    }

    for (const n of notesB) {
      if (!notesA.includes(n)) {
        changes.push({
          changeType: "NOTE",
          actionType: "ADDED",
          category: "Note Added",
          description: `New drawing note added: ${n}`,
          oldValue: undefined,
          newValue: n,
          boundingBox: JSON.stringify({ x: 50, y: 650, w: 250, h: 60 }),
          manufacturingImpact: "Follow plating or deburring specification as stated in the note.",
          qualityImpact: "Verify finish thickness or coupon testing requirement.",
        });
      }
    }

    // Compare Material
    if (revA.material !== revB.material) {
      changes.push({
        changeType: "TITLE_BLOCK",
        actionType: "CHANGED",
        category: "Material Spec Changed",
        description: `Material changed from ${revA.material} to ${revB.material}`,
        oldValue: revA.material || "Not specified",
        newValue: revB.material || "Not specified",
        boundingBox: JSON.stringify({ x: 450, y: 120, w: 120, h: 50 }),
        manufacturingImpact: `Material change may impact cutting speed, tool wear, and heat-treat profiles. Calibrate feed rates.`,
        qualityImpact: `Verify material certificate conforms to the new specification before machining.`,
      });
    }

    // Save detected changes
    for (const c of changes) {
      await prisma.drawingDetectedChange.create({
        data: {
          jobId: job.id,
          changeType: c.changeType,
          actionType: c.actionType,
          category: c.category,
          description: c.description,
          oldValue: c.oldValue,
          newValue: c.newValue,
          boundingBox: c.boundingBox,
          manufacturingImpact: c.manufacturingImpact,
          qualityImpact: c.qualityImpact,
        },
      });
    }

    // Generate drawing comparison report summary
    const summaryText = `Drawing Comparison report between ${revA.revisionLabel} and ${revB.revisionLabel} generated ${changes.length} change logs. Out of these, ${changes.filter((c) => c.changeType === "DIMENSION").length} dimensions were modified or added.`;
    const mfgImpactsText = changes
      .map((c) => c.manufacturingImpact)
      .filter(Boolean)
      .join(" ");
    const qualityImpactsText = changes
      .map((c) => c.qualityImpact)
      .filter(Boolean)
      .join(" ");

    await prisma.drawingReport.create({
      data: {
        projectId: job.projectId,
        title: `Revision Change Report - ${revA.revisionLabel} vs ${revB.revisionLabel}`,
        summary: summaryText,
        changesJson: JSON.stringify(changes),
        mfgImpact: mfgImpactsText || "Unable to determine.",
        qualityImpact: qualityImpactsText || "Unable to determine.",
      },
    });

    // Update job status to completed
    await prisma.drawingComparisonJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
      },
    });
  } catch (error) {
    console.error("Comparison process failed:", error);
    await prisma.drawingComparisonJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Comparison failed.",
      },
    });
    throw error;
  }
}
