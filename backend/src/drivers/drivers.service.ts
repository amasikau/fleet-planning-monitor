import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  private formatDriver(driver: any) {
    return {
      userId: driver.user.id,
      username: driver.user.username,
      lastName: driver.user.lastName,
      firstName: driver.user.firstName,
      middleName: driver.user.middleName,
      position: driver.user.position,
      categories: driver.categories,
      documents: driver.documents.map((d: any) => ({
        type: d.type,
        fileName: d.fileName,
        filePath: d.filePath || '',
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      assignedAt: driver.assignedAt.toISOString(),
    };
  }

  private driverInclude = {
    user: {
      select: {
        id: true,
        username: true,
        lastName: true,
        firstName: true,
        middleName: true,
        position: true,
      },
    },
    documents: true,
  };

  async findAll() {
    const drivers = await this.prisma.driver.findMany({
      include: this.driverInclude,
      orderBy: { assignedAt: 'asc' },
    });
    return drivers.map(this.formatDriver);
  }

  async findUnassigned() {
    return this.prisma.user.findMany({
      where: {
        role: 'driver',
        driver: null,
      },
      select: {
        id: true,
        username: true,
        lastName: true,
        firstName: true,
        middleName: true,
        role: true,
        position: true,
        status: true,
        avatar: true,
        isOnline: true,
        createdAt: true,
      },
    });
  }

  async assign(dto: AssignDriverDto, performedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { driver: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (user.driver) {
      throw new ConflictException('Пользователь уже назначен водителем');
    }

    const driver = await this.prisma.driver.create({
      data: {
        userId: dto.userId,
        categories: dto.categories,
        documents: {
          create: (dto.documents || []).map((doc) => ({
            type: doc.type,
            fileName: doc.fileName,
            filePath: doc.filePath || '',
          })),
        },
      },
      include: this.driverInclude,
    });

    await this.prisma.driverAuditLog.create({
      data: {
        action: 'assign',
        targetUserId: dto.userId,
        performedById,
        details: `Назначен водителем с категориями: ${dto.categories.join(', ')}`,
      },
    });

    if (dto.documents && dto.documents.length > 0) {
      for (const doc of dto.documents) {
        await this.prisma.driverAuditLog.create({
          data: {
            action: 'doc_upload',
            targetUserId: dto.userId,
            performedById,
            details: `Загружен документ: ${doc.fileName} (${doc.type})`,
          },
        });
      }
    }

    return this.formatDriver(driver);
  }

  async update(userId: string, dto: UpdateDriverDto, performedById: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!driver) {
      throw new NotFoundException('Водитель не найден');
    }

    const updateData: any = {};

    if (dto.categories) {
      updateData.categories = dto.categories;

      await this.prisma.driverAuditLog.create({
        data: {
          action: 'category_change',
          targetUserId: userId,
          performedById,
          details: `Изменены категории: ${dto.categories.join(', ')}`,
        },
      });
    }

    if (dto.documents) {
      // Remove existing documents and replace
      await this.prisma.driverDocument.deleteMany({
        where: { driverId: driver.id },
      });

      updateData.documents = {
        create: dto.documents.map((doc) => ({
          type: doc.type,
          fileName: doc.fileName,
          filePath: doc.filePath || '',
        })),
      };

      for (const doc of dto.documents) {
        await this.prisma.driverAuditLog.create({
          data: {
            action: 'doc_upload',
            targetUserId: userId,
            performedById,
            details: `Загружен документ: ${doc.fileName} (${doc.type})`,
          },
        });
      }
    }

    const updated = await this.prisma.driver.update({
      where: { userId },
      data: updateData,
      include: this.driverInclude,
    });

    return this.formatDriver(updated);
  }

  async unassign(userId: string, performedById: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new NotFoundException('Водитель не найден');
    }

    await this.prisma.driverAuditLog.create({
      data: {
        action: 'unassign',
        targetUserId: userId,
        performedById,
        details: 'Снят с должности водителя',
      },
    });

    await this.prisma.driver.delete({ where: { userId } });

    return { success: true };
  }

  async getAuditLog(query: {
    search?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const logs = await this.prisma.driverAuditLog.findMany({
      where,
      include: {
        targetUser: { select: { username: true } },
        performedBy: { select: { username: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    let result = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      targetUser: log.targetUser.username,
      performedBy: log.performedBy.username,
      details: log.details,
    }));

    if (query.search) {
      const s = query.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.targetUser.toLowerCase().includes(s) ||
          r.performedBy.toLowerCase().includes(s) ||
          r.details.toLowerCase().includes(s),
      );
    }

    return result;
  }
}
