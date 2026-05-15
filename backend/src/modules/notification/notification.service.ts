import prisma from '@/config/database';
import { NotificationType } from '@prisma/client';
import { io } from '@/app';

interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const createNotification = async (userId: string, dto: CreateNotificationDto) => {
  const notification = await prisma.notification.create({
    data: { userId, ...dto },
  });

  // Real-time push via Socket.io
  io.to(`user:${userId}`).emit('notification', notification);

  return notification;
};

export const getNotifications = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [total, notifications, unreadCount] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.findMany({
      where: { userId },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
};

export const markAllRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const markRead = async (userId: string, notifId: string) => {
  await prisma.notification.updateMany({
    where: { id: notifId, userId },
    data: { isRead: true },
  });
};
