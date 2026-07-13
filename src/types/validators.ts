import { z } from "zod";

export const timestampSchema = z.object({
  label: z.string().min(1, "Label is required").max(255),
  value: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type TimestampInput = z.infer<typeof timestampSchema>;
