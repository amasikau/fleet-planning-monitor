import {
  BadRequestException,
  ForbiddenException,
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

/* ── View interfaces ── */

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
  mechanic: { userId: string; fullName: string } | null;
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

/* ── Prisma includes ── */

const serviceEventInclude = {
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      plateNumber: true,
      assignedDriverUserId: true,
    },
  },
  mechanic: {
    select: {
      id: true,
      username: true,
      lastName: true,
      firstName: true,
      middleName: true,
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

  /* ── Formatters ── */

  private isManager(role: UserRole) {
    return role === 'admin' || role === 'moderator';
  }

  private getFullName(user: {
    lastName: string;
    firstName: string;
    middleName: string;
  }) {
    return [user.lastName, user.firstName, user.middleName]
      .filter(Boolean)
      .join(' ');
  }

  private getPermissions(event: ServiceEventRecord, actor: AuthUser) {
    const isManager = this.isManager(actor.role);
    const isOwnRepair = event.mechanicId === actor.id;
    const isOwnVehicleRepair = event.vehicle.assignedDriverUserId === actor.id;

    return {
      canEdit: isManager || (actor.role === 'mechanic' && isOwnRepair),
      canDelete: isManager,
      canAssign: isManager,
      isOwnRepair,
      isOwnVehicleRepair,
    };
  }

  private formatEvent(
    event: ServiceEventRecord,
    actor: AuthUser,
  ): ServiceEventView {
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
      mechanic: event.mechanic
        ? {
            userId: event.mechanic.id,
            fullName: this.getFullName(event.mechanic),
          }
        : null,
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
      permissions: this.getPermissions(event, actor),
    };
  }

  /* ── Vehicle status recalculation ── */

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

  /* ── CRUD ── */

  async findAll(
    query: {
      vehicleId?: string;
      status?: string;
      type?: string;
      search?: string;
    },
    actor: AuthUser,
  ): Promise<ServiceEventView[]> {
    const where: Prisma.FleetServiceEventWhereInput = {};

    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.status) where.status = query.status as FleetServiceEventStatus;
    if (query.type) where.type = query.type as FleetServiceEventType;

    const events = await this.prisma.fleetServiceEvent.findMany({
      where,
      include: serviceEventInclude,
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });

    let result = events.map((e) => this.formatEvent(e, actor));

    if (query.search) {
      const s = query.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.vehicleLabel.toLowerCase().includes(s) ||
          (e.mechanic?.fullName ?? '').toLowerCase().includes(s) ||
          (e.reporter?.fullName ?? '').toLowerCase().includes(s) ||
          e.defectDescription.toLowerCase().includes(s) ||
          e.notes.toLowerCase().includes(s),
      );
    }

    return result;
  }

  async getStats(): Promise<ServiceStatsView> {
    const [scheduled, inProgress, overdue, completed] = await Promise.all([
      this.prisma.fleetServiceEvent.count({
        where: { status: 'scheduled' },
      }),
      this.prisma.fleetServiceEvent.count({
        where: { status: 'in_progress' },
      }),
      this.prisma.fleetServiceEvent.count({
        where: { status: 'overdue' },
      }),
      this.prisma.fleetServiceEvent.count({
        where: { status: 'completed' },
      }),
    ]);

    return { scheduled, inProgress, overdue, completed };
  }

  async create(
    dto: CreateServiceEventDto,
    actor: AuthUser,
  ): Promise<ServiceEventView> {
    if (actor.role === 'mechanic') {
      throw new ForbiddenException(
        'Механики не могут создавать заявки на ремонт',
      );
    }

    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Транспорт не найден');

    const isManager = this.isManager(actor.role);
    if (!dto.title.trim()) {
      throw new BadRequestException('Укажите название заявки');
    }

    if (!isManager && vehicle.assignedDriverUserId !== actor.id) {
      throw new ForbiddenException(
        'Водители могут создавать заявки только по закреплённому транспорту',
      );
    }

    if (!isManager && dto.type !== 'repair') {
      throw new ForbiddenException(
        'Водители могут создавать только заявки на ремонт',
      );
    }

    if (!isManager && (dto.mechanicId || dto.dueAt)) {
      throw new ForbiddenException(
        'Назначать механиков и сроки могут только администраторы и модераторы',
      );
    }
    if (!isManager && !dto.defectDescription?.trim()) {
      throw new BadRequestException('Опишите дефект');
    }

    if (dto.mechanicId) {
      await this.assertMechanic(dto.mechanicId);
    }

    const event = await this.prisma.fleetServiceEvent.create({
      data: {
        vehicleId: dto.vehicleId,
        type: dto.type,
        status: dto.mechanicId ? 'in_progress' : 'scheduled',
        title: dto.title.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        mechanicId: dto.mechanicId ?? null,
        reportedById: actor.id,
        defectDescription: dto.defectDescription?.trim() ?? '',
        notes: dto.notes?.trim() ?? '',
      },
      include: serviceEventInclude,
    });

    if (dto.mechanicId) {
      await this.recalcVehicleStatus(dto.vehicleId);
    }

    return this.formatEvent(event, actor);
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

    const isManager = this.isManager(actor.role);
    const isAssignedMechanic =
      actor.role === 'mechanic' && existing.mechanicId === actor.id;

    if (!isManager && !isAssignedMechanic) {
      throw new ForbiddenException(
        'Вести ремонт может только назначенный механик',
      );
    }

    if (dto.mechanicId !== undefined && dto.mechanicId !== null) {
      await this.assertMechanic(dto.mechanicId);
    }

    const updateData: Prisma.FleetServiceEventUpdateInput = {};

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.dueAt !== undefined) {
      updateData.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes.trim();
    if (dto.mileageKm !== undefined) updateData.mileageKm = dto.mileageKm;

    if (isManager) {
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.defectDescription !== undefined) {
        updateData.defectDescription = dto.defectDescription.trim();
      }

      if (dto.mechanicId !== undefined) {
        updateData.mechanic = dto.mechanicId
          ? { connect: { id: dto.mechanicId } }
          : { disconnect: true };

        if (dto.mechanicId && existing.status === 'scheduled') {
          updateData.status = dto.status ?? 'in_progress';
        } else if (!dto.mechanicId && existing.status !== 'completed') {
          updateData.status = dto.status ?? 'scheduled';
        }
      }
    } else {
      const titleChanged =
        dto.title !== undefined && dto.title.trim() !== existing.title;
      const defectChanged =
        dto.defectDescription !== undefined &&
        dto.defectDescription.trim() !== existing.defectDescription;
      const mechanicChanged =
        dto.mechanicId !== undefined &&
        (dto.mechanicId ?? null) !== (existing.mechanicId ?? null);
      const managerOnlyFields =
        titleChanged || defectChanged || mechanicChanged;

      if (managerOnlyFields) {
        throw new ForbiddenException(
          'Это поле могут менять только администраторы и модераторы',
        );
      }
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

    // Recalculate vehicle status if status changed
    if (dto.status !== undefined && dto.status !== existing.status) {
      await this.recalcVehicleStatus(existing.vehicleId);
    } else if (dto.mechanicId !== undefined) {
      await this.recalcVehicleStatus(existing.vehicleId);
    }

    return this.formatEvent(updated, actor);
  }

  async remove(id: string, actor: AuthUser): Promise<{ success: boolean }> {
    if (!this.isManager(actor.role)) {
      throw new ForbiddenException(
        'Удалять заявки могут только администраторы и модераторы',
      );
    }

    const existing = await this.prisma.fleetServiceEvent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Заявка не найдена');

    await this.prisma.fleetServiceEvent.delete({ where: { id } });

    // Recalculate vehicle status after removal
    await this.recalcVehicleStatus(existing.vehicleId);

    return { success: true };
  }

  private async assertMechanic(userId: string) {
    const mechanic = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mechanic: true },
    });

    if (!mechanic || mechanic.role !== 'mechanic' || !mechanic.mechanic) {
      throw new BadRequestException(
        'Выбранный пользователь не назначен механиком',
      );
    }
  }
}

export interface AuthUser {
  id: string;
  role: UserRole;
}
