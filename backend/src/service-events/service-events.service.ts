import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FleetServiceEventStatus,
  FleetServiceEventType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceEventDto } from './dto/create-service-event.dto';
import { UpdateServiceEventDto } from './dto/update-service-event.dto';

export interface ServiceEventView {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  type: FleetServiceEventType;
  status: FleetServiceEventStatus;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  mileageKm: number | null;
  reporter: { userId: string; fullName: string; role: UserRole } | null;
  workLogs: {
    id: string;
    performedAt: string;
    title: string;
    description: string;
    mileageKm: number | null;
    createdBy: string | null;
    createdAt: string;
  }[];
  defectDescription: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
    isOwnRepair: boolean;
    isOwnVehicleRepair: boolean;
  };
}

export interface ServiceStatsView {
  scheduled: number;
  inProgress: number;
  overdue: number;
  completed: number;
}

const serviceEventInclude = {
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      plateNumber: true,
    },
  },
  reporter: {
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      role: true,
    },
  },
  workLogs: {
    include: {
      createdBy: {
        select: {
          lastName: true,
          firstName: true,
          middleName: true,
        },
      },
    },
    orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
  },
} satisfies Prisma.FleetServiceEventInclude;

type ServiceEventRecord = Prisma.FleetServiceEventGetPayload<{
  include: typeof serviceEventInclude;
}>;

@Injectable()
export class ServiceEventsService {
  constructor(private readonly prisma: PrismaService) {}

  private getFullName(user: {
    lastName: string;
    firstName: string;
    middleName: string;
  }) {
    return [user.lastName, user.firstName, user.middleName]
      .filter(Boolean)
      .join(' ');
  }

  private getPermissions() {
    return {
      canEdit: true,
      canDelete: true,
      canAssign: true,
      isOwnRepair: false,
      isOwnVehicleRepair: false,
    };
  }

  private formatEvent(event: ServiceEventRecord): ServiceEventView {
    return {
      id: event.id,
      vehicleId: event.vehicle.id,
      vehicleLabel: `${event.vehicle.brand} ${event.vehicle.model} · ${event.vehicle.plateNumber}`,
      type: event.type,
      status: event.status,
      title: event.title,
      dueAt: event.dueAt?.toISOString() ?? null,
      completedAt: event.completedAt?.toISOString() ?? null,
      mileageKm: event.mileageKm,
      reporter: event.reporter
        ? {
            userId: event.reporter.id,
            fullName: this.getFullName(event.reporter),
            role: event.reporter.role,
          }
        : null,
      workLogs: event.workLogs.map((log) => ({
        id: log.id,
        performedAt: log.performedAt.toISOString(),
        title: log.title,
        description: log.description,
        mileageKm: log.mileageKm,
        createdBy: log.createdBy ? this.getFullName(log.createdBy) : null,
        createdAt: log.createdAt.toISOString(),
      })),
      defectDescription: event.defectDescription,
      notes: event.notes,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      permissions: this.getPermissions(),
    };
  }

  private async recalcVehicleStatus(vehicleId: string) {
    const activeRepairs = await this.prisma.fleetServiceEvent.count({
      where: {
        vehicleId,
        status: 'in_progress',
        type: { in: ['repair', 'maintenance'] },
      },
    });

    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) return;

    if (activeRepairs > 0 && vehicle.status !== 'maintenance') {
      await this.prisma.fleetVehicle.update({
        where: { id: vehicleId },
        data: {
          previousStatus: vehicle.status,
          status: 'maintenance',
        },
      });
    } else if (
      activeRepairs === 0 &&
      (vehicle.status === 'maintenance' || vehicle.status === 'repair')
    ) {
      await this.prisma.fleetVehicle.update({
        where: { id: vehicleId },
        data: {
          status: vehicle.previousStatus,
        },
      });
    }
  }

  async findAll(query: {
    vehicleId?: string;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<ServiceEventView[]> {
    const where: Prisma.FleetServiceEventWhereInput = {};

    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.status) where.status = query.status as FleetServiceEventStatus;
    if (query.type) where.type = query.type as FleetServiceEventType;

    const events = await this.prisma.fleetServiceEvent.findMany({
      where,
      include: serviceEventInclude,
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });

    let result = events.map((event) => this.formatEvent(event));

    if (query.search) {
      const search = query.search.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(search) ||
          event.vehicleLabel.toLowerCase().includes(search) ||
          (event.reporter?.fullName ?? '').toLowerCase().includes(search) ||
          event.defectDescription.toLowerCase().includes(search) ||
          event.notes.toLowerCase().includes(search),
      );
    }

    return result;
  }

  async getStats(): Promise<ServiceStatsView> {
    const [scheduled, inProgress, overdue, completed] = await Promise.all([
      this.prisma.fleetServiceEvent.count({ where: { status: 'scheduled' } }),
      this.prisma.fleetServiceEvent.count({ where: { status: 'in_progress' } }),
      this.prisma.fleetServiceEvent.count({ where: { status: 'overdue' } }),
      this.prisma.fleetServiceEvent.count({ where: { status: 'completed' } }),
    ]);

    return { scheduled, inProgress, overdue, completed };
  }

  async create(
    dto: CreateServiceEventDto,
    actor: AuthUser,
  ): Promise<ServiceEventView> {
    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Техника не найдена');

    if (!dto.title.trim()) {
      throw new BadRequestException('Укажите название заявки');
    }

    const event = await this.prisma.fleetServiceEvent.create({
      data: {
        vehicleId: dto.vehicleId,
        type: dto.type,
        status: 'scheduled',
        title: dto.title.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        reportedById: actor.id,
        defectDescription: dto.defectDescription?.trim() ?? '',
        notes: dto.notes?.trim() ?? '',
      },
      include: serviceEventInclude,
    });

    return this.formatEvent(event);
  }

  async update(
    id: string,
    dto: UpdateServiceEventDto,
    actor: AuthUser,
  ): Promise<ServiceEventView> {
    const existing = await this.prisma.fleetServiceEvent.findUnique({
      where: { id },
      include: serviceEventInclude,
    });
    if (!existing) throw new NotFoundException('Заявка не найдена');

    const updateData: Prisma.FleetServiceEventUpdateInput = {};

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.dueAt !== undefined) {
      updateData.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes.trim();
    if (dto.mileageKm !== undefined) updateData.mileageKm = dto.mileageKm;
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.defectDescription !== undefined) {
      updateData.defectDescription = dto.defectDescription.trim();
    }

    if (dto.workLogs !== undefined) {
      const workLogs = dto.workLogs.map((log) => {
        if (!log.title.trim()) {
          throw new BadRequestException('Укажите название выполненной работы');
        }

        return {
          performedAt: new Date(log.performedAt),
          title: log.title.trim(),
          description: log.description?.trim() ?? '',
          mileageKm: log.mileageKm ?? null,
          createdById: actor.id,
        };
      });

      updateData.workLogs = {
        deleteMany: {},
        create: workLogs,
      };
    }

    if (dto.status === 'completed') {
      updateData.completedAt = dto.completedAt
        ? new Date(dto.completedAt)
        : new Date();
    } else if (dto.status !== undefined) {
      updateData.completedAt = null;
    }

    const updated = await this.prisma.fleetServiceEvent.update({
      where: { id },
      data: updateData,
      include: serviceEventInclude,
    });

    if (dto.status !== undefined && dto.status !== existing.status) {
      await this.recalcVehicleStatus(existing.vehicleId);
    }

    return this.formatEvent(updated);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.fleetServiceEvent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Заявка не найдена');

    await this.prisma.fleetServiceEvent.delete({ where: { id } });
    await this.recalcVehicleStatus(existing.vehicleId);

    return { success: true };
  }
}

export interface AuthUser {
  id: string;
  role: UserRole;
}
