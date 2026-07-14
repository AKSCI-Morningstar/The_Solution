import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";

export const notificationFilterSchema = paginationSchema.extend({
  isRead: z.coerce.boolean().optional(),
});
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  link: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
