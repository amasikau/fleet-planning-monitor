import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FleetVehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignMechanicDto } from './dto/assign-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

const fleetVehicleTypeLabels: Record<FleetVehicleType, string> = {
  dump_truck: 'Грузовой самосвал',
  crane: 'Автокран',
  excavator: 'Экскаватор',
  bulldozer: 'Бульдозер',
  tractor: 'Трактор',
  loader: 'Погрузчик фронтальный',
  asphalt_paver: 'Асфальтоукладчик',
  road_roller: 'Каток дорожный',
  motor_grader: 'Автогрейдер',
  truck_tractor: 'Грузовой седельный тягач',
  flatbed_truck: 'Грузовой бортовой',
  semi_trailer: 'Полуприцеп',
  passenger_car: 'Легковой автомобиль',
  van: 'Фургон снабжения',
  pickup: 'Пикап',
};

@Injectable()
export class MechanicsService {
  constructor(private prisma: PrismaService) {}

  private formatVehicleTypes(vehicleTypes: FleetVehicleType[]) {
    return vehicleTypes.map((type) => fleetVehicleTypeLabels[type]).join(', ');
  }

  private formatMechanic(mechanic: any) {
    return {
      userId: mechanic.user.id,
      username: mechanic.user.username,
      lastName: mechanic.user.lastName,
      firstName: mechanic.user.firstName,
      middleName: mechanic.user.middleName,
      position: mechanic.user.position,
      vehicleTypes: mechanic.vehicleTypes,
      documents: mechanic.documents.map((d: any) => ({
        type: d.type,
        fileName: d.fileName,
        filePath: d.filePath || '',
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      assignedAt: mechanic.assignedAt.toISOString(),
    };
  }

  private mechanicInclude = {
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
    const mechanics = await this.prisma.mechanic.findMany({
      include: this.mechanicInclude,
      orderBy: { assignedAt: 'asc' },
    });
    return mechanics.map(this.formatMechanic);
  }

  async findUnassigned() {
    return this.prisma.user.findMany({
      where: {
        role: 'mechanic',
        mechanic: null,
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

  async assign(dto: AssignMechanicDto, performedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { mechanic: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (user.mechanic) {
      throw new ConflictException('Пользователь уже назначен механиком');
    }

    const mechanic = await this.prisma.mechanic.create({
      data: {
        userId: dto.userId,
        specializations: [],
        vehicleTypes: dto.vehicleTypes,
        documents: {
          create: (dto.documents || []).map((doc) => ({
            type: doc.type,
            fileName: doc.fileName,
            filePath: doc.filePath || '',
          })),
        },
      },
      include: this.mechanicInclude,
    });

    await this.prisma.mechanicAuditLog.create({
      data: {
        action: 'assign',
        targetUserId: dto.userId,
        performedById,
        details: `Назначен механиком с допуском к технике: ${this.formatVehicleTypes(dto.vehicleTypes)}`,
      },
    });

    if (dto.documents && dto.documents.length > 0) {
      for (const doc of dto.documents) {
        await this.prisma.mechanicAuditLog.create({
          data: {
            action: 'doc_upload',
            targetUserId: dto.userId,
            performedById,
            details: `Загружен документ: ${doc.fileName} (${doc.type})`,
          },
        });
      }
    }

    return this.formatMechanic(mechanic);
  }

  async update(userId: string, dto: UpdateMechanicDto, performedById: string) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!mechanic) {
      throw new NotFoundException('Механик не найден');
    }

    const updateData: any = {};

    if (dto.vehicleTypes) {
      updateData.vehicleTypes = dto.vehicleTypes;

      await this.prisma.mechanicAuditLog.create({
        data: {
          action: 'vehicle_type_change',
          targetUserId: userId,
          performedById,
          details: `Изменён допуск к технике: ${this.formatVehicleTypes(dto.vehicleTypes)}`,
        },
      });
    }

    if (dto.documents) {
      await this.prisma.mechanicDocument.deleteMany({
        where: { mechanicId: mechanic.id },
      });

      updateData.documents = {
        create: dto.documents.map((doc) => ({
          type: doc.type,
          fileName: doc.fileName,
          filePath: doc.filePath || '',
        })),
      };

      for (const doc of dto.documents) {
        await this.prisma.mechanicAuditLog.create({
          data: {
            action: 'doc_upload',
            targetUserId: userId,
            performedById,
            details: `Загружен документ: ${doc.fileName} (${doc.type})`,
          },
        });
      }
    }

    const updated = await this.prisma.mechanic.update({
      where: { userId },
      data: updateData,
      include: this.mechanicInclude,
    });

    return this.formatMechanic(updated);
  }

  async unassign(userId: string, performedById: string) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { userId },
    });
    if (!mechanic) {
      throw new NotFoundException('Механик не найден');
    }

    await this.prisma.mechanicAuditLog.create({
      data: {
        action: 'unassign',
        targetUserId: userId,
        performedById,
        details: 'Снят с должности механика',
      },
    });

    await this.prisma.mechanic.delete({ where: { userId } });

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

    const logs = await this.prisma.mechanicAuditLog.findMany({
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
