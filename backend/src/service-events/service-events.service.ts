import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FleetRepairCategory,
  FleetRepairTemplate,
  FleetServiceEventStatus,
  FleetServiceEventType,
  FleetVehicleStatus,
  FleetVehicleType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceEventDto } from './dto/create-service-event.dto';
import { CreateRepairTemplateDto } from './dto/create-repair-template.dto';
import { UpdateRepairTemplateDto } from './dto/update-repair-template.dto';
import { UpdateServiceEventDto } from './dto/update-service-event.dto';

export interface RepairTemplateView {
  id: string;
  vehicleType: FleetVehicleType;
  serviceEventType: FleetServiceEventType;
  category: FleetRepairCategory;
  name: string;
  durationDays: number;
  sortOrder: number;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceEventView {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  vehicleType: FleetVehicleType;
  repairTemplate: RepairTemplateView | null;
  type: FleetServiceEventType;
  status: FleetServiceEventStatus;
  title: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
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
      type: true,
    },
  },
  repairTemplate: true,
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

  private normalizeDate(value: string | Date) {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }

  private formatTemplate(template: {
    id: string;
    vehicleType: FleetVehicleType;
    serviceEventType: FleetServiceEventType;
    category: FleetRepairCategory;
    name: string;
    durationDays: number;
    sortOrder: number;
    notes: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RepairTemplateView {
    return {
      id: template.id,
      vehicleType: template.vehicleType,
      serviceEventType: template.serviceEventType,
      category: template.category,
      name: template.name,
      durationDays: template.durationDays,
      sortOrder: template.sortOrder,
      notes: template.notes,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  private async getTemplateForVehicle(
    templateId: string | null | undefined,
    vehicleType: FleetVehicleType,
  ) {
    if (!templateId) return null;

    const template = await this.prisma.fleetRepairTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template)
      throw new NotFoundException('Ремонт из справочника не найден');
    if (!template.isActive) {
      throw new BadRequestException('Выбранный ремонт отключён в справочнике');
    }
    if (template.vehicleType !== vehicleType) {
      throw new BadRequestException(
        'Выбранный ремонт не подходит для типа выбранной техники',
      );
    }

    return template;
  }

  private buildServicePeriod(params: {
    startDate?: string | Date | null;
    dueAt?: string | Date | null;
    durationDays?: number | null;
  }) {
    const durationDays = Math.max(params.durationDays ?? 1, 1);
    const startSource = params.startDate ?? params.dueAt ?? new Date();
    const startDate = this.normalizeDate(startSource);
    const endDate = this.addDays(startDate, durationDays - 1);
    return { startDate, endDate, durationDays };
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
      vehicleType: event.vehicle.type,
      repairTemplate: event.repairTemplate
        ? this.formatTemplate(event.repairTemplate)
        : null,
      type: event.type,
      status: event.status,
      title: event.title,
      startDate: event.startDate?.toISOString() ?? null,
      endDate: event.endDate?.toISOString() ?? null,
      durationDays: event.durationDays,
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

  private isBlockedVehicleStatus(status: FleetVehicleStatus) {
    return status === 'maintenance' || status === 'repair';
  }

  private getRestoredVehicleStatus(previousStatus: FleetVehicleStatus) {
    return this.isBlockedVehicleStatus(previousStatus)
      ? 'active'
      : previousStatus;
  }

  private async recalcVehicleStatus(vehicleId: string) {
    const activeServiceEvents = await this.prisma.fleetServiceEvent.findMany({
      where: {
        vehicleId,
        status: 'in_progress',
        type: { in: ['repair', 'maintenance'] },
      },
      select: { type: true },
    });

    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) return;

    const nextBlockedStatus: FleetVehicleStatus | null =
      activeServiceEvents.length === 0
        ? null
        : activeServiceEvents.some((event) => event.type === 'repair')
          ? 'repair'
          : 'maintenance';

    if (nextBlockedStatus) {
      const data: Prisma.FleetVehicleUpdateInput = {
        status: nextBlockedStatus,
      };

      if (!this.isBlockedVehicleStatus(vehicle.status)) {
        data.previousStatus = vehicle.status;
      }

      if (
        vehicle.status !== nextBlockedStatus ||
        data.previousStatus !== undefined
      ) {
        await this.prisma.fleetVehicle.update({
          where: { id: vehicleId },
          data,
        });
      }
      return;
    }

    if (this.isBlockedVehicleStatus(vehicle.status)) {
      const restoredStatus = this.getRestoredVehicleStatus(
        vehicle.previousStatus,
      );
      await this.prisma.fleetVehicle.update({
        where: { id: vehicleId },
        data: {
          previousStatus: restoredStatus,
          status: restoredStatus,
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
          (event.repairTemplate?.name ?? '').toLowerCase().includes(search) ||
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

  async getRepairTemplates(query: {
    vehicleType?: string;
    includeInactive?: string;
  }): Promise<RepairTemplateView[]> {
    const where: Prisma.FleetRepairTemplateWhereInput = {};
    if (query.vehicleType) {
      where.vehicleType = query.vehicleType as FleetVehicleType;
    }
    if (query.includeInactive !== 'true') {
      where.isActive = true;
    }

    const templates = await this.prisma.fleetRepairTemplate.findMany({
      where,
      orderBy: [
        { vehicleType: 'asc' },
        { serviceEventType: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return templates.map((template) => this.formatTemplate(template));
  }

  async createRepairTemplate(
    dto: CreateRepairTemplateDto,
  ): Promise<RepairTemplateView> {
    const template = await this.prisma.fleetRepairTemplate.create({
      data: {
        vehicleType: dto.vehicleType,
        serviceEventType: dto.serviceEventType,
        category: dto.category,
        name: dto.name.trim(),
        durationDays: dto.durationDays,
        sortOrder: dto.sortOrder ?? 100,
        notes: dto.notes?.trim() ?? '',
        isActive: dto.isActive ?? true,
      },
    });

    return this.formatTemplate(template);
  }

  async updateRepairTemplate(
    id: string,
    dto: UpdateRepairTemplateDto,
  ): Promise<RepairTemplateView> {
    const existing = await this.prisma.fleetRepairTemplate.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Ремонт из справочника не найден');

    const template = await this.prisma.fleetRepairTemplate.update({
      where: { id },
      data: {
        vehicleType: dto.vehicleType,
        serviceEventType: dto.serviceEventType,
        category: dto.category,
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        durationDays: dto.durationDays,
        sortOrder: dto.sortOrder,
        notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
        isActive: dto.isActive,
      },
    });

    return this.formatTemplate(template);
  }

  async removeRepairTemplate(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.fleetRepairTemplate.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Ремонт из справочника не найден');

    await this.prisma.fleetRepairTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  async create(
    dto: CreateServiceEventDto,
    actor: AuthUser,
  ): Promise<ServiceEventView> {
    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Техника не найдена');

    const template = await this.getTemplateForVehicle(
      dto.repairTemplateId,
      vehicle.type,
    );
    const title = dto.title?.trim() || template?.name || '';
    if (!title) {
      throw new BadRequestException(
        'Выберите ремонт из справочника или укажите название заявки',
      );
    }
    const period = this.buildServicePeriod({
      startDate: dto.startDate,
      dueAt: dto.dueAt,
      durationDays: template?.durationDays ?? dto.durationDays ?? 1,
    });

    const event = await this.prisma.fleetServiceEvent.create({
      data: {
        vehicleId: dto.vehicleId,
        repairTemplateId: template?.id ?? null,
        type: template?.serviceEventType ?? dto.type,
        status: 'scheduled',
        title,
        startDate: period.startDate,
        endDate: period.endDate,
        durationDays: period.durationDays,
        dueAt: period.endDate,
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
    let nextTemplate: FleetRepairTemplate | null = existing.repairTemplate;

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.repairTemplateId !== undefined) {
      nextTemplate = dto.repairTemplateId
        ? await this.getTemplateForVehicle(
            dto.repairTemplateId,
            existing.vehicle.type,
          )
        : null;
      updateData.repairTemplate = nextTemplate
        ? { connect: { id: nextTemplate.id } }
        : { disconnect: true };
      if (nextTemplate) {
        updateData.type = nextTemplate.serviceEventType;
      }
    }
    if (
      dto.startDate !== undefined ||
      dto.durationDays !== undefined ||
      dto.repairTemplateId !== undefined ||
      dto.dueAt !== undefined
    ) {
      const period = this.buildServicePeriod({
        startDate: dto.startDate ?? existing.startDate,
        dueAt: dto.dueAt ?? existing.dueAt,
        durationDays:
          nextTemplate?.durationDays ??
          dto.durationDays ??
          existing.durationDays,
      });
      updateData.startDate = period.startDate;
      updateData.endDate = period.endDate;
      updateData.durationDays = period.durationDays;
      updateData.dueAt = period.endDate;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes.trim();
    if (dto.mileageKm !== undefined) updateData.mileageKm = dto.mileageKm;
    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    } else if (dto.repairTemplateId !== undefined && nextTemplate) {
      updateData.title = nextTemplate.name;
    }
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

    if (
      dto.status !== undefined ||
      dto.type !== undefined ||
      dto.repairTemplateId !== undefined
    ) {
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
