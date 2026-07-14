/**
 * Curated starting notification types - stored as a plain string column, so
 * new subsystems can introduce their own type without a schema change.
 */
export const NOTIFICATION_TYPES = [
  "ORCHESTRATION_COMPLETED",
  "ORCHESTRATION_FAILED",
  "ORCHESTRATION_CANCELLED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number] | (string & {});
