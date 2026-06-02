import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EquipmentDemandPriority,
  EquipmentPlanShift,
  EquipmentPlanStatus,
  FleetVehicleStatus,
  FleetVehicleType,
  Prisma,
  RoadWorkStageStatus,
  RoadWorkStageType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDemandDto } from './dto/create-equipment-demand.dto';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { CreateRoadWorkStageDto } from './dto/create-road-work-stage.dto';
import { UpdateEquipmentDemandDto } from './dto/update-equipment-demand.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';
import { UpdateRoadWorkStageDto } from './dto/update-road-work-stage.dto';

const siteSelect = {
  id: true,
  name: true,
  workType: true,
  isCompleted: true,
} satisfies Prisma.ConstructionSiteSelect;

const stageSelect = {
  id: true,
  name: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
} satisfies Prisma.RoadWorkStageSelect;

const equipmentPlanInclude = {
  site: { select: siteSelect },
  stage: { select: stageSelect },
  demand: {
    select: {
      id: true,
      vehicleType: true,
      requiredCount: true,
      plannedHours: true,
      priority: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      plateNumber: true,
      status: true,
      type: true,
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

const roadWorkStageInclude = {
  site: { select: siteSelect },
} satisfies Prisma.RoadWorkStageInclude;

const equipmentDemandInclude = {
  site: { select: siteSelect },
  stage: { select: stageSelect },
} satisfies Prisma.EquipmentDemandInclude;

type EquipmentPlanRecord = Prisma.EquipmentPlanAssignmentGetPayload<{
  include: typeof equipmentPlanInclude;
}>;

type RoadWorkStageRecord = Prisma.RoadWorkStageGetPayload<{
  include: typeof roadWorkStageInclude;
}>;

type EquipmentDemandRecord = Prisma.EquipmentDemandGetPayload<{
  include: typeof equipmentDemandInclude;
}>;

export interface EquipmentPlanView {
  id: string;
  siteId: string;
  siteName: string;
  siteWorkType: string;
  stageId: string | null;
  stageName: string | null;
  stageType: RoadWorkStageType | null;
  demandId: string | null;
  demandVehicleType: FleetVehicleType | null;
  vehicleId: string;
  vehicleLabel: string;
  vehicleType: FleetVehicleType;
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
  deficitDemands: number;
  criticalDeficits: number;
  averageCoverage: number;
}

export interface RoadWorkStageView {
  id: string;
  siteId: string;
  siteName: string;
  siteWorkType: string;
  type: RoadWorkStageType;
  name: string;
  startDate: string;
  endDate: string;
  status: RoadWorkStageStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentDemandView {
  id: string;
  siteId: string;
  siteName: string;
  siteWorkType: string;
  stageId: string | null;
  stageName: string | null;
  stageType: RoadWorkStageType | null;
  vehicleType: FleetVehicleType;
  requiredCount: number;
  plannedHours: number;
  priority: EquipmentDemandPriority;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentCoverageView {
  id: string;
  siteId: string;
  siteName: string;
  stageId: string | null;
  stageName: string | null;
  stageType: RoadWorkStageType | null;
  vehicleType: FleetVehicleType;
  requiredCount: number;
  assignedCount: number;
  deficit: number;
  coveragePercent: number;
  plannedHours: number;
  assignedPlannedHours: number;
  priority: EquipmentDemandPriority;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

@Injectable()
export class EquipmentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(value: string) {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private normalizeOptionalId(value?: string | null) {
    return value?.trim() ? value : null;
  }

  private assertDateRange(startDate: Date, endDate: Date) {
    if (endDate < startDate) {
      throw new ConflictException('Дата окончания этапа не может быть раньше даты начала');
    }
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

  private formatStage(stage: RoadWorkStageRecord): RoadWorkStageView {
    return {
      id: stage.id,
      siteId: stage.siteId,
      siteName: stage.site.name,
      siteWorkType: stage.site.workType,
      type: stage.type,
      name: stage.name,
      startDate: stage.startDate.toISOString(),
      endDate: stage.endDate.toISOString(),
      status: stage.status,
      notes: stage.notes,
      createdAt: stage.createdAt.toISOString(),
      updatedAt: stage.updatedAt.toISOString(),
    };
  }

  private formatDemand(demand: EquipmentDemandRecord): EquipmentDemandView {
    return {
      id: demand.id,
      siteId: demand.siteId,
      siteName: demand.site.name,
      siteWorkType: demand.site.workType,
      stageId: demand.stageId,
      stageName: demand.stage?.name ?? null,
      stageType: demand.stage?.type ?? null,
      vehicleType: demand.vehicleType,
      requiredCount: demand.requiredCount,
      plannedHours: demand.plannedHours,
      priority: demand.priority,
      notes: demand.notes,
      createdAt: demand.createdAt.toISOString(),
      updatedAt: demand.updatedAt.toISOString(),
    };
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
    if (plan.demand && plan.vehicle.type !== plan.demand.vehicleType) {
      warnings.push('Тип техники не соответствует заявленной потребности');
    }

    return {
      id: plan.id,
      siteId: plan.siteId,
      siteName: plan.site.name,
      siteWorkType: plan.site.workType,
      stageId: plan.stageId,
      stageName: plan.stage?.name ?? null,
      stageType: plan.stage?.type ?? null,
      demandId: plan.demandId,
      demandVehicleType: plan.demand?.vehicleType ?? null,
      vehicleId: plan.vehicleId,
      vehicleLabel: `${plan.vehicle.brand} ${plan.vehicle.model} · ${plan.vehicle.plateNumber}`,
      vehicleType: plan.vehicle.type,
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
    return site;
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Техника не найдена');
    if (vehicle.status === 'maintenance' || vehicle.status === 'repair') {
      throw new ConflictException('Техника в ремонте или на ТО недоступна для планирования');
    }
    return vehicle;
  }

  private async assertStage(stageId: string, siteId: string) {
    const stage = await this.prisma.roadWorkStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Этап дорожных работ не найден');
    if (stage.siteId !== siteId) {
      throw new ConflictException('Этап должен относиться к выбранному дорожному объекту');
    }
    return stage;
  }

  private async assertDemand(
    demandId: string,
    siteId: string,
    stageId: string | null,
    vehicleType: FleetVehicleType,
  ) {
    const demand = await this.prisma.equipmentDemand.findUnique({
      where: { id: demandId },
    });
    if (!demand) throw new NotFoundException('Потребность в технике не найдена');
    if (demand.siteId !== siteId) {
      throw new ConflictException('Потребность должна относиться к выбранному дорожному объекту');
    }
    if (stageId && demand.stageId && demand.stageId !== stageId) {
      throw new ConflictException('Потребность должна относиться к выбранному этапу работ');
    }
    if (demand.vehicleType !== vehicleType) {
      throw new ConflictException('Тип выбранной техники не соответствует потребности');
    }
    return demand;
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
    const [
      planned,
      inProgress,
      completed,
      failed,
      missingActual,
      withoutDriver,
      coverage,
    ] = await Promise.all([
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
      this.getCoverage({}),
    ]);

    const deficitDemands = coverage.filter((item) => item.deficit > 0).length;
    const criticalDeficits = coverage.filter(
      (item) => item.deficit > 0 && item.priority === 'critical',
    ).length;
    const averageCoverage =
      coverage.length > 0
        ? Math.round(
            coverage.reduce((sum, item) => sum + item.coveragePercent, 0) /
              coverage.length,
          )
        : 100;

    return {
      planned,
      inProgress,
      completed,
      failed,
      missingActual,
      withoutDriver,
      deficitDemands,
      criticalDeficits,
      averageCoverage,
    };
  }

  async getStages(query: { siteId?: string }): Promise<RoadWorkStageView[]> {
    const stages = await this.prisma.roadWorkStage.findMany({
      where: query.siteId ? { siteId: query.siteId } : undefined,
      include: roadWorkStageInclude,
      orderBy: [{ startDate: 'asc' }, { endDate: 'asc' }],
    });

    return stages.map((stage) => this.formatStage(stage));
  }

  async createStage(dto: CreateRoadWorkStageDto): Promise<RoadWorkStageView> {
    await this.assertSite(dto.siteId);

    const startDate = this.normalizeDate(dto.startDate);
    const endDate = this.normalizeDate(dto.endDate);
    this.assertDateRange(startDate, endDate);

    const stage = await this.prisma.roadWorkStage.create({
      data: {
        siteId: dto.siteId,
        type: dto.type,
        name: dto.name.trim(),
        startDate,
        endDate,
        status: dto.status ?? 'planned',
        notes: dto.notes?.trim() ?? '',
      },
      include: roadWorkStageInclude,
    });

    return this.formatStage(stage);
  }

  async updateStage(
    id: string,
    dto: UpdateRoadWorkStageDto,
  ): Promise<RoadWorkStageView> {
    const existing = await this.prisma.roadWorkStage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Этап дорожных работ не найден');

    const siteId = dto.siteId ?? existing.siteId;
    if (dto.siteId) await this.assertSite(siteId);

    const startDate = dto.startDate
      ? this.normalizeDate(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate
      ? this.normalizeDate(dto.endDate)
      : existing.endDate;
    this.assertDateRange(startDate, endDate);

    const stage = await this.prisma.roadWorkStage.update({
      where: { id },
      data: {
        siteId: dto.siteId,
        type: dto.type,
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
      },
      include: roadWorkStageInclude,
    });

    return this.formatStage(stage);
  }

  async removeStage(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.roadWorkStage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Этап дорожных работ не найден');

    await this.prisma.roadWorkStage.delete({ where: { id } });
    return { success: true };
  }

  async getDemands(query: { siteId?: string }): Promise<EquipmentDemandView[]> {
    const demands = await this.prisma.equipmentDemand.findMany({
      where: query.siteId ? { siteId: query.siteId } : undefined,
      include: equipmentDemandInclude,
      orderBy: [
        { site: { name: 'asc' } },
        { priority: 'desc' },
        { vehicleType: 'asc' },
      ],
    });

    return demands.map((demand) => this.formatDemand(demand));
  }

  async createDemand(
    dto: CreateEquipmentDemandDto,
  ): Promise<EquipmentDemandView> {
    await this.assertSite(dto.siteId);

    const stageId = this.normalizeOptionalId(dto.stageId);
    if (stageId) await this.assertStage(stageId, dto.siteId);

    const demand = await this.prisma.equipmentDemand.create({
      data: {
        siteId: dto.siteId,
        stageId,
        vehicleType: dto.vehicleType,
        requiredCount: dto.requiredCount,
        plannedHours: dto.plannedHours,
        priority: dto.priority ?? 'normal',
        notes: dto.notes?.trim() ?? '',
      },
      include: equipmentDemandInclude,
    });

    return this.formatDemand(demand);
  }

  async updateDemand(
    id: string,
    dto: UpdateEquipmentDemandDto,
  ): Promise<EquipmentDemandView> {
    const existing = await this.prisma.equipmentDemand.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Потребность в технике не найдена');

    const siteId = dto.siteId ?? existing.siteId;
    if (dto.siteId) await this.assertSite(siteId);

    const stageId =
      dto.stageId !== undefined
        ? this.normalizeOptionalId(dto.stageId)
        : existing.stageId;
    if (stageId) await this.assertStage(stageId, siteId);

    const demand = await this.prisma.equipmentDemand.update({
      where: { id },
      data: {
        siteId: dto.siteId,
        stageId: dto.stageId !== undefined ? stageId : undefined,
        vehicleType: dto.vehicleType,
        requiredCount: dto.requiredCount,
        plannedHours: dto.plannedHours,
        priority: dto.priority,
        notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
      },
      include: equipmentDemandInclude,
    });

    return this.formatDemand(demand);
  }

  async removeDemand(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.equipmentDemand.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Потребность в технике не найдена');

    await this.prisma.equipmentDemand.delete({ where: { id } });
    return { success: true };
  }

  async getCoverage(query: { siteId?: string }): Promise<EquipmentCoverageView[]> {
    const [demands, plans, availableByType] = await Promise.all([
      this.prisma.equipmentDemand.findMany({
        where: query.siteId ? { siteId: query.siteId } : undefined,
        include: equipmentDemandInclude,
        orderBy: [
          { site: { name: 'asc' } },
          { priority: 'desc' },
          { vehicleType: 'asc' },
        ],
      }),
      this.prisma.equipmentPlanAssignment.findMany({
        where: query.siteId ? { siteId: query.siteId } : undefined,
        include: {
          vehicle: {
            select: {
              id: true,
              type: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.fleetVehicle.groupBy({
        by: ['type'],
        where: { status: { in: ['active', 'reserve'] } },
        _count: { _all: true },
      }),
    ]);

    const availableMap = new Map<FleetVehicleType, number>(
      availableByType.map((item) => [item.type, item._count._all]),
    );

    return demands.map((demand) => {
      const matchingPlans = plans.filter((plan) => {
        if (plan.status === 'failed') return false;
        if (plan.vehicle.status === 'maintenance' || plan.vehicle.status === 'repair') {
          return false;
        }
        if (plan.vehicle.type !== demand.vehicleType) return false;
        if (plan.demandId === demand.id) return true;
        if (plan.siteId !== demand.siteId) return false;
        if (demand.stageId && plan.stageId !== demand.stageId) return false;
        return plan.demandId == null;
      });

      const assignedVehicles = new Set(
        matchingPlans.map((plan) => plan.vehicleId),
      );
      const assignedCount = assignedVehicles.size;
      const assignedPlannedHours = matchingPlans.reduce(
        (sum, plan) => sum + plan.plannedHours,
        0,
      );
      const deficit = Math.max(demand.requiredCount - assignedCount, 0);
      const coveragePercent = Math.min(
        Math.round((assignedCount / demand.requiredCount) * 100),
        100,
      );
      const availableCount = availableMap.get(demand.vehicleType) ?? 0;
      const riskLevel: EquipmentCoverageView['riskLevel'] =
        deficit === 0 ? 'low' : demand.priority === 'critical' ? 'high' : 'medium';
      const recommendation = this.buildCoverageRecommendation({
        deficit,
        priority: demand.priority,
        availableCount,
        vehicleType: demand.vehicleType,
        assignedPlannedHours,
        plannedHours: demand.plannedHours,
        requiredCount: demand.requiredCount,
      });

      return {
        id: demand.id,
        siteId: demand.siteId,
        siteName: demand.site.name,
        stageId: demand.stageId,
        stageName: demand.stage?.name ?? null,
        stageType: demand.stage?.type ?? null,
        vehicleType: demand.vehicleType,
        requiredCount: demand.requiredCount,
        assignedCount,
        deficit,
        coveragePercent,
        plannedHours: demand.plannedHours,
        assignedPlannedHours,
        priority: demand.priority,
        riskLevel,
        recommendation,
      };
    });
  }

  private buildCoverageRecommendation(params: {
    deficit: number;
    priority: EquipmentDemandPriority;
    availableCount: number;
    vehicleType: FleetVehicleType;
    assignedPlannedHours: number;
    plannedHours: number;
    requiredCount: number;
  }) {
    if (params.deficit > 0 && params.priority === 'critical') {
      return `Критический дефицит: добавить ${params.deficit} ед. техники или снять с менее приоритетного этапа.`;
    }
    if (params.deficit > 0 && params.availableCount >= params.deficit) {
      return `Закрыть дефицит из активной техники или резерва: доступно ${params.availableCount} ед. нужного типа.`;
    }
    if (params.deficit > 0) {
      return `Нужен пересмотр графика или привлечение ${params.deficit} ед. техники со стороны.`;
    }

    const targetHours = params.plannedHours * params.requiredCount;
    if (params.assignedPlannedHours < targetHours) {
      return 'Количество техники закрыто, но плановые часы ниже потребности этапа.';
    }

    return 'Потребность закрыта, назначение можно оставить в плане.';
  }

  async create(
    dto: CreateEquipmentPlanDto,
    createdById: string,
  ): Promise<EquipmentPlanView> {
    await this.assertSite(dto.siteId);
    const vehicle = await this.assertVehicle(dto.vehicleId);

    let stageId = this.normalizeOptionalId(dto.stageId);
    const demandId = this.normalizeOptionalId(dto.demandId);

    if (stageId) await this.assertStage(stageId, dto.siteId);
    if (demandId) {
      const demand = await this.assertDemand(
        demandId,
        dto.siteId,
        stageId,
        vehicle.type,
      );
      if (!stageId && demand.stageId) stageId = demand.stageId;
    }

    try {
      const plan = await this.prisma.equipmentPlanAssignment.create({
        data: {
          siteId: dto.siteId,
          stageId,
          demandId,
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

    const shouldValidateVehicleAvailability =
      dto.vehicleId !== undefined ||
      dto.siteId !== undefined ||
      dto.workDate !== undefined ||
      dto.shift !== undefined;
    const vehicle = shouldValidateVehicleAvailability
      ? await this.assertVehicle(vehicleId)
      : await this.prisma.fleetVehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) throw new NotFoundException('Техника не найдена');

    let stageId =
      dto.stageId !== undefined
        ? this.normalizeOptionalId(dto.stageId)
        : existing.stageId;
    const demandId =
      dto.demandId !== undefined
        ? this.normalizeOptionalId(dto.demandId)
        : existing.demandId;

    if (stageId) await this.assertStage(stageId, siteId);
    if (demandId) {
      const demand = await this.assertDemand(
        demandId,
        siteId,
        stageId,
        vehicle.type,
      );
      if (!stageId && demand.stageId) stageId = demand.stageId;
    }

    try {
      const plan = await this.prisma.equipmentPlanAssignment.update({
        where: { id },
        data: {
          siteId: dto.siteId,
          stageId:
            dto.stageId !== undefined || (demandId && stageId !== existing.stageId)
              ? stageId
              : undefined,
          demandId: dto.demandId !== undefined ? demandId : undefined,
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
