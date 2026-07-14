import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/**
 * Every security-relevant event that isn't already covered by a specific
 * auth flow's own logging (login/logout/register/reset already write their
 * own AuthEvent rows in auth-service.ts) funnels through here - RBAC
 * denials, CSRF rejections, rate-limit violations. Reuses the existing
 * AuthEvent table rather than introducing a parallel security-log model.
 */
export async function recordSecurityEvent(
  action: string,
  opts: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  await prisma.authEvent.create({
    data: {
      userId: opts.userId,
      action,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      metadata: opts.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
