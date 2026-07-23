/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db";
import { ForbiddenError, NotFoundError } from "@/shared/errors";

export interface CreateAssessmentInput {
  organizationId: string;
  projectId?: string;
  title: string;
  description: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceSummary?: any;
  consequencesJson?: any;
  createdById: string;
}

export async function createAssessment(input: CreateAssessmentInput) {
  return prisma.drawingAssessment.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      severity: input.severity || "MEDIUM",
      status: "draft",
      version: 1,
      evidenceSummary: input.evidenceSummary || {},
      consequencesJson: input.consequencesJson || [],
      lastEditedById: input.createdById,
      lastEditedAt: new Date(),
    },
    include: {
      project: true,
      submittedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateAssessment(
  id: string,
  userId: string,
  input: Partial<CreateAssessmentInput>,
  changeReason: string,
) {
  const assessment = await prisma.drawingAssessment.findUnique({ where: { id } });
  if (!assessment) throw new NotFoundError("Assessment not found");

  if (assessment.status !== "draft") {
    throw new ForbiddenError(
      `Cannot edit assessment in '${assessment.status}' status. Only draft assessments can be edited.`,
    );
  }

  // Record edit history chunks for modified fields
  const fieldChanges: { fieldName: string; oldValue?: string; newValue?: string }[] = [];

  if (input.title !== undefined && input.title !== assessment.title) {
    fieldChanges.push({ fieldName: "title", oldValue: assessment.title, newValue: input.title });
  }
  if (input.description !== undefined && input.description !== assessment.description) {
    fieldChanges.push({
      fieldName: "description",
      oldValue: assessment.description,
      newValue: input.description,
    });
  }
  if (input.severity !== undefined && input.severity !== assessment.severity) {
    fieldChanges.push({
      fieldName: "severity",
      oldValue: assessment.severity,
      newValue: input.severity,
    });
  }

  const updated = await prisma.drawingAssessment.update({
    where: { id },
    data: {
      title: input.title ?? assessment.title,
      description: input.description ?? assessment.description,
      severity: input.severity ?? assessment.severity,
      evidenceSummary: input.evidenceSummary ?? assessment.evidenceSummary,
      consequencesJson: input.consequencesJson ?? assessment.consequencesJson,
      lastEditedById: userId,
      lastEditedAt: new Date(),
      editReason: changeReason,
    },
  });

  for (const change of fieldChanges) {
    await prisma.assessmentEditHistory.create({
      data: {
        assessmentId: id,
        editedById: userId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeReason,
        statusBefore: assessment.status,
        statusAfter: assessment.status,
      },
    });
  }

  return updated;
}

export async function submitAssessment(id: string, userId: string) {
  const assessment = await prisma.drawingAssessment.findUnique({ where: { id } });
  if (!assessment) throw new NotFoundError("Assessment not found");

  if (assessment.status !== "draft") {
    throw new ForbiddenError("Only draft assessments can be submitted for review");
  }

  const updated = await prisma.drawingAssessment.update({
    where: { id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      submittedById: userId,
    },
  });

  // Find workspace approvers (owners/admins/managers)
  const approvers = await prisma.organizationMember.findMany({
    where: {
      organizationId: assessment.organizationId,
      role: { in: ["owner", "admin", "manager"] },
      status: "active",
    },
  });

  for (const member of approvers) {
    await prisma.assessmentReview.create({
      data: {
        assessmentId: id,
        reviewerId: member.userId,
        status: "pending",
      },
    });
  }

  return updated;
}

export async function approveAssessment(id: string, reviewerId: string, approvalReason: string) {
  const assessment = await prisma.drawingAssessment.findUnique({ where: { id } });
  if (!assessment) throw new NotFoundError("Assessment not found");

  if (assessment.status !== "submitted") {
    throw new ForbiddenError("Only submitted assessments can be approved");
  }

  const updated = await prisma.drawingAssessment.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedById: reviewerId,
      approvalReason,
    },
  });

  await prisma.assessmentReview.updateMany({
    where: { assessmentId: id, reviewerId },
    data: {
      status: "approved",
      feedback: approvalReason,
      resolutionDate: new Date(),
    },
  });

  return updated;
}

export async function requestChanges(id: string, reviewerId: string, feedback: string) {
  const assessment = await prisma.drawingAssessment.findUnique({ where: { id } });
  if (!assessment) throw new NotFoundError("Assessment not found");

  if (assessment.status !== "submitted") {
    throw new ForbiddenError("Only submitted assessments can undergo review resolution");
  }

  const updated = await prisma.drawingAssessment.update({
    where: { id },
    data: {
      status: "draft",
    },
  });

  await prisma.assessmentReview.updateMany({
    where: { assessmentId: id, reviewerId },
    data: {
      status: "rejected",
      feedback,
      resolutionDate: new Date(),
    },
  });

  return updated;
}

export async function createRevision(id: string, userId: string) {
  const parent = await prisma.drawingAssessment.findUnique({ where: { id } });
  if (!parent) throw new NotFoundError("Original assessment not found");

  if (parent.status !== "approved") {
    throw new ForbiddenError("Revisions can only be created from approved assessments");
  }

  // Mark old version as superseded
  await prisma.drawingAssessment.update({
    where: { id },
    data: { status: "superseded" },
  });

  // Create new revision version draft
  const revision = await prisma.drawingAssessment.create({
    data: {
      organizationId: parent.organizationId,
      projectId: parent.projectId,
      title: `${parent.title} (v${parent.version + 1})`,
      description: parent.description,
      severity: parent.severity,
      status: "draft",
      version: parent.version + 1,
      parentAssessmentId: parent.id,
      evidenceSummary: parent.evidenceSummary || {},
      consequencesJson: parent.consequencesJson || [],
      lastEditedById: userId,
      lastEditedAt: new Date(),
    },
  });

  return revision;
}

export async function addComment(assessmentId: string, userId: string, text: string) {
  return prisma.assessmentComment.create({
    data: {
      assessmentId,
      userId,
      text,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function resolveComment(commentId: string) {
  return prisma.assessmentComment.update({
    where: { id: commentId },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
    },
  });
}

export async function getAssessments(organizationId: string) {
  return prisma.drawingAssessment.findMany({
    where: { organizationId },
    include: {
      project: true,
      submittedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      parentAssessment: true,
      reviews: { include: { reviewer: { select: { id: true, name: true } } } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      editHistory: {
        include: { editedBy: { select: { id: true, name: true } } },
        orderBy: { editedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPendingReviews(organizationId: string, reviewerId?: string) {
  return prisma.assessmentReview.findMany({
    where: {
      status: "pending",
      assessment: { organizationId },
      ...(reviewerId ? { reviewerId } : {}),
    },
    include: {
      assessment: {
        include: {
          project: true,
          submittedBy: { select: { id: true, name: true, email: true } },
          editHistory: { include: { editedBy: { select: { id: true, name: true } } } },
          comments: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
