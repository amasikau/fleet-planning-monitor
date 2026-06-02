import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EquipmentPlanAssignment,
  EquipmentPlanShift,
  EquipmentPlanStatus,
  FleetVehicleStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';

const equipmentPlanInclude = {
  site: {
    select: {
      id: true,
      name: true,
      workType: true,
      isCompleted: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      plateNumber: true,
      status: true,
      assignedDriver: {
        include: {
          user: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              middleName: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.EquipmentPlanAssignmentInclude;

type EquipmentPlanRecord = Prisma.EquipmentPlanAssignmentGetPayload<{
  include: typeof equipmentPlanInclude;
}>;

export interface EquipmentPlanView {
  id: string;
  siteId: string;
  siteName: string;
  siteWorkType: string;
  vehicleId: string;
  vehicleLabel: string;
  vehicleStatus: FleetVehicleStatus;
  driver: { userId: string; fullName: string } | null;
  workDate: string;
  shift: EquipmentPlanShift;
  plannedHours: number;
  actualHours: number | null;
  status: EquipmentPlanStatus;
  notes: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentPlanStatsView {
  planned: number;
  inProgress: number;
  completed: number;
  failed: number;
  missingActual: number;
  withoutDriver: number;
}

@Injectable()
export class EquipmentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(value: string) {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
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

  private formatPlan(plan: EquipmentPlanRecord): EquipmentPlanView {
    const driver = plan.vehicle.assignedDriver;
    const warnings: string[] = [];
    const isPast = plan.workDate < new Date();

    if (!driver) {
      warnings.push('Техника без закреплённого водителя');
    }
    if (isPast && plan.status !== 'completed' && plan.actualHours == null) {
      warnings.push('Не заполнены фактические часы после даты работ');
    }
    if (plan.vehicle.status === 'maintenance' || plan.vehicle.status === 'repair') {
      warnings.push('Техника находится в ремонте или на ТО');
    }

    return {
      id: plan.id,
      siteId: plan.siteId,
      siteName: plan.site.name,
      siteWorkType: plan.site.workType,
      vehicleId: plan.vehicleId,
      vehicleLabel: `${plan.vehicle.brand} ${plan.vehicle.model} · ${plan.vehicle.plateNumber}`,
      vehicleStatus: plan.vehicle.status,
      driver: driver
        ? {
            userId: driver.userId,
            fullName: this.getFullName(driver.user),
          }
        : null,
      workDate: plan.workDate.toISOString(),
      shift: plan.shift,
      plannedHours: plan.plannedHours,
      actualHours: plan.actualHours,
      status: plan.status,
      notes: plan.notes,
      warnings,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  private async assertSite(siteId: string) {
    const site = await this.prisma.constructionSite.findUnique({
      where: { id: siteId },
    });
    if (!site) throw new NotFoundException('Дорожный объект не найден');
    if (site.isCompleted) {
      throw new ConflictException('Нельзя планировать технику на завершённый объект');
    }
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Техника не найдена');
    if (vehicle.status === 'maintenance' || vehicle.status === 'repair') {
      throw new ConflictException('Техника в ремонте или на ТО недоступна для планирования');
    }
  }

  async findAll(query: {
    siteId?: string;
    vehicleId?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<EquipmentPlanView[]> {
    const where: Prisma.EquipmentPlanAssignmentWhereInput = {};

    if (query.siteId) where.siteId = query.siteId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.status) where.status = query.status as EquipmentPlanStatus;
    if (query.from || query.to) {
      where.workDate = {};
      if (query.from) where.workDate.gte = this.normalizeDate(query.from);
      if (query.to) where.workDate.lte = this.normalizeDate(query.to);
    }

    const plans = await this.prisma.equipmentPlanAssignment.findMany({
      where,
      include: equipmentPlanInclude,
      orderBy: [{ workDate: 'asc' }, { shift: 'asc' }, { createdAt: 'desc' }],
    });

    return plans.map((plan) => this.formatPlan(plan));
  }

  async getStats(): Promise<EquipmentPlanStatsView> {
    const [planned, inProgress, completed, failed, missingActual, withoutDriver] =
      await Promise.all([
        this.prisma.equipmentPlanAssignment.count({
          where: { status: 'planned' },
        }),
        this.prisma.equipmentPlanAssignment.count({
          where: { status: 'in_progress' },
        }),
        this.prisma.equipmentPlanAssignment.count({
          where: { status: 'completed' },
        }),
        this.prisma.equipmentPlanAssignment.count({
          where: { status: 'failed' },
        }),
        this.prisma.equipmentPlanAssignment.count({
          where: {
            workDate: { lt: new Date() },
            actualHours: null,
            status: { not: 'completed' },
          },
        }),
        this.prisma.equipmentPlanAssignment.count({
          where: { vehicle: { assignedDriverUserId: null } },
        }),
      ]);

    return {
      planned,
      inProgress,
      completed,
      failed,
      missingActual,
      withoutDriver,
    };
  }

  async create(
    dto: CreateEquipmentPlanDto,
    createdById: string,
  ): Promise<EquipmentPlanView> {
    await this.assertSite(dto.siteId);
    await this.assertVehicle(dto.vehicleId);

    try {
      const plan = await this.prisma.equipmentPlanAssignment.create({
        data: {
          siteId: dto.siteId,
          vehicleId: dto.vehicleId,
          workDate: this.normalizeDate(dto.workDate),
          shift: dto.shift,
          plannedHours: dto.plannedHours,
          actualHours: dto.actualHours ?? null,
          status: dto.status ?? 'planned',
          notes: dto.notes?.trim() ?? '',
          createdById,
        },
        include: equipmentPlanInclude,
      });
      return this.formatPlan(plan);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Эта техника уже запланирована на выбранную дату и смену',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateEquipmentPlanDto,
  ): Promise<EquipmentPlanView> {
    const existing = await this.prisma.equipmentPlanAssignment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Запись план-графика не найдена');

    const siteId = dto.siteId ?? existing.siteId;
    const vehicleId = dto.vehicleId ?? existing.vehicleId;

    if (dto.siteId) await this.assertSite(siteId);
    if (dto.vehicleId) await this.assertVehicle(vehicleId);

    try {
      const plan = await this.prisma.equipmentPlanAssignment.update({
        where: { id },
        data: {
          siteId: dto.siteId,
          vehicleId: dto.vehicleId,
          workDate: dto.workDate ? this.normalizeDate(dto.workDate) : undefined,
          shift: dto.shift,
          plannedHours: dto.plannedHours,
          actualHours: dto.actualHours,
          status: dto.status,
          notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
        },
        include: equipmentPlanInclude,
      });
      return this.formatPlan(plan);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Эта техника уже запланирована на выбранную дату и смену',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.equipmentPlanAssignment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Запись план-графика не найдена');

    await this.prisma.equipmentPlanAssignment.delete({ where: { id } });
    return { success: true };
  }
}
