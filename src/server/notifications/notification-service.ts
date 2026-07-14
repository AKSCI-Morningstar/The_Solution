import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import type { CreateNotificationInput, NotificationFilterInput } from "./validation";

export async function createNotification(organizationId: string, input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listNotifications(
  organizationId: string,
  userId: string,
  filters: NotificationFilterInput,
) {
  const { isRead, page, pageSize } = filters;
  const where: Prisma.NotificationWhereInput = { organizationId, userId };
  if (isRead !== undefined) where.isRead = isRead;

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { organizationId, userId, isRead: false } }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize), unreadCount };
}

export async function markNotificationRead(id: string, organizationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, organizationId, userId },
  });
  if (!notification) throw new NotFoundError("Notification", id);

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllNotificationsRead(
  organizationId: string,
  userId: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { organizationId, userId, isRead: false },
    data: { isRead: true },
  });
}
