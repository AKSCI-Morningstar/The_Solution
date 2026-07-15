import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";

export const auditFilterSchema = paginationSchema.extend({
  action: z.string().min(1).max(200).optional(),
  entity: z.string().min(1).max(200).optional(),
  entityId: z.string().min(1).max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().max(500).optional(),
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
