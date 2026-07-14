import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";
import { REALITY_OUTCOMES, REALITY_RUN_STATUSES } from "./constants";

export const startRealityAssessmentSchema = z.object({
  orchestrationRunId: z.string().min(1),
});
export type StartRealityAssessmentInput = z.infer<typeof startRealityAssessmentSchema>;

export const realityAssessmentFilterSchema = paginationSchema.extend({
  status: z.enum(REALITY_RUN_STATUSES).optional(),
  outcome: z.enum(REALITY_OUTCOMES).optional(),
  subjectEntityId: z.string().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type RealityAssessmentFilterInput = z.infer<typeof realityAssessmentFilterSchema>;

export const realityStageLogFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
});
export type RealityStageLogFilterInput = z.infer<typeof realityStageLogFilterSchema>;

export const compareAssessmentsSchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1)).min(2).max(5)),
});
export type CompareAssessmentsInput = z.infer<typeof compareAssessmentsSchema>;
