import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCategory, UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: UserRole) {
    const categoryFilter: NotificationCategory[] = ['system', 'security'];
    if (userRole === 'admin' || userRole === 'moderator') {
      categoryFilter.push('action');
    }

    const notifications = await this.prisma.notification.findMany({
      where: { category: { in: categoryFilter } },
      include: {
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      description: n.description,
      createdAt: n.createdAt.toISOString(),
      read: n.reads.length > 0,
    }));
  }

  async getUnreadCount(userId: string, userRole: UserRole) {
    const categoryFilter: NotificationCategory[] = ['system', 'security'];
    if (userRole === 'admin' || userRole === 'moderator') {
      categoryFilter.push('action');
    }

    const total = await this.prisma.notification.count({
      where: { category: { in: categoryFilter } },
    });

    const readCount = await this.prisma.notificationRead.count({
      where: {
        userId,
        notification: { category: { in: categoryFilter } },
      },
    });

    return { unreadCount: total - readCount };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId },
      },
      create: { notificationId, userId },
      update: {},
    });
    return { success: true };
  }

  async markAllAsRead(userId: string, userRole: UserRole) {
    const categoryFilter: NotificationCategory[] = ['system', 'security'];
    if (userRole === 'admin' || userRole === 'moderator') {
      categoryFilter.push('action');
    }

    const unreadNotifications = await this.prisma.notification.findMany({
      where: {
        category: { in: categoryFilter },
        reads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadNotifications.length > 0) {
      await this.prisma.notificationRead.createMany({
        data: unreadNotifications.map((n) => ({
          notificationId: n.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true };
  }
}
