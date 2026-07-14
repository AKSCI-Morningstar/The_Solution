import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";
import { RUN_STATUSES } from "./constants";

export const startOrchestrationSchema = z.object({
  subjectEntityId: z.string().min(1),
  requestedRuleIds: z.array(z.string().min(1)).max(200).optional(),
  maxDepth: z.number().int().min(1).max(10).default(3),
});
export type StartOrchestrationInput = z.infer<typeof startOrchestrationSchema>;

export const orchestrationRunFilterSchema = paginationSchema.extend({
  status: z.enum(RUN_STATUSES).optional(),
  subjectEntityId: z.string().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type OrchestrationRunFilterInput = z.infer<typeof orchestrationRunFilterSchema>;

export const stageLogFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
});
export type StageLogFilterInput = z.infer<typeof stageLogFilterSchema>;
