import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EquipmentCalculationKind,
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
import { ApplyEquipmentPlanDraftDto } from './dto/apply-equipment-plan-draft.dto';
import { CreateEquipmentDemandDto } from './dto/create-equipment-demand.dto';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { CreateRoadWorkStageDto } from './dto/create-road-work-stage.dto';
import { CreateRoadWorkStageTemplateDto } from './dto/create-road-work-stage-template.dto';
import { CreateRoadWorkTypeTemplateDto } from './dto/create-road-work-type-template.dto';
import {
  EquipmentPlanDraftRuleDto,
  EquipmentPlanDraftStageDto,
  GenerateEquipmentPlanDraftDto,
} from './dto/generate-equipment-plan-draft.dto';
import { UpdateEquipmentDemandDto } from './dto/update-equipment-demand.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';
import { UpdateRoadWorkStageDto } from './dto/update-road-work-stage.dto';
import { UpdateRoadWorkStageTemplateDto } from './dto/update-road-work-stage-template.dto';
import { UpdateRoadWorkTypeTemplateDto } from './dto/update-road-work-type-template.dto';

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

const roadWorkTypeTemplateInclude = {
  stageTemplates: {
    orderBy: [{ sequence: 'asc' }],
    include: {
      stageTemplate: {
        include: {
          equipmentRules: {
            orderBy: [{ priority: 'desc' }, { vehicleType: 'asc' }],
          },
        },
      },
    },
  },
} satisfies Prisma.RoadWorkTypeTemplateInclude;

const roadWorkStageTemplateInclude = {
  equipmentRules: {
    orderBy: [{ priority: 'desc' }, { vehicleType: 'asc' }],
  },
} satisfies Prisma.RoadWorkStageTemplateInclude;

type EquipmentPlanRecord = Prisma.EquipmentPlanAssignmentGetPayload<{
  include: typeof equipmentPlanInclude;
}>;

type RoadWorkStageRecord = Prisma.RoadWorkStageGetPayload<{
  include: typeof roadWorkStageInclude;
}>;

type EquipmentDemandRecord = Prisma.EquipmentDemandGetPayload<{
  include: typeof equipmentDemandInclude;
}>;

type RoadWorkTypeTemplateRecord = Prisma.RoadWorkTypeTemplateGetPayload<{
  include: typeof roadWorkTypeTemplateInclude;
}>;

type RoadWorkStageTemplateRecord = Prisma.RoadWorkStageTemplateGetPayload<{
  include: typeof roadWorkStageTemplateInclude;
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

export interface RoadWorkStageEquipmentTemplateView {
  id: string;
  vehicleType: FleetVehicleType;
  calculationKind: EquipmentCalculationKind;
  baseCount: number;
  countPerKm: number;
  minCount: number;
  maxCount: number | null;
  plannedHours: number;
  priority: EquipmentDemandPriority;
  notes: string;
}

export interface RoadWorkStageTemplateView {
  id: string;
  type: RoadWorkStageType;
  name: string;
  sequence: number;
  startOffsetDays: number;
  durationDays: number;
  canOverlap: boolean;
  notes: string;
  equipmentRules: RoadWorkStageEquipmentTemplateView[];
}

export interface RoadWorkTypeTemplateView {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultLengthKm: number;
  defaultWidthM: number;
  defaultShiftHours: number;
  defaultHaulDistanceKm: number;
  productionRateMPerDay: number;
  sourceNote: string;
  stageTemplates: RoadWorkStageTemplateView[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentPlanDraftDemandView {
  vehicleType: FleetVehicleType;
  requiredCount: number;
  plannedHours: number;
  priority: EquipmentDemandPriority;
  calculationKind: EquipmentCalculationKind;
  calculationNote: string;
  availableCount: number;
  repairCount: number;
  conflictCount: number;
  withoutDriverCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  notes: string;
}

export interface EquipmentPlanDraftStageView {
  templateStageId: string | null;
  type: RoadWorkStageType;
  name: string;
  sequence: number;
  startOffsetDays: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  canOverlap: boolean;
  notes: string;
  demands: EquipmentPlanDraftDemandView[];
}

export interface EquipmentPlanDraftView {
  siteId: string;
  siteName: string;
  workTypeId: string;
  workTypeName: string;
  startDate: string;
  lengthKm: number;
  widthM: number;
  shiftHours: number;
  haulDistanceKm: number;
  stages: EquipmentPlanDraftStageView[];
  summary: {
    totalStages: number;
    totalDemands: number;
    totalRequiredUnits: number;
    criticalRisks: number;
    plannedAssignments: number;
  };
}

export interface AppliedEquipmentPlanDraftView {
  createdStages: number;
  createdDemands: number;
  createdAssignments: number;
  skippedAssignments: number;
  draft: EquipmentPlanDraftView;
}

@Injectable()
export class EquipmentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDate(value: string) {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private planSlotKey(vehicleId: string, workDate: Date, shift: EquipmentPlanShift) {
    return `${vehicleId}:${this.dateKey(workDate)}:${shift}`;
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

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }

  private daysBetweenInclusive(startDate: Date, endDate: Date) {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }

  private formatWorkType(
    template: RoadWorkTypeTemplateRecord,
  ): RoadWorkTypeTemplateView {
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      description: template.description,
      defaultLengthKm: template.defaultLengthKm,
      defaultWidthM: template.defaultWidthM,
      defaultShiftHours: template.defaultShiftHours,
      defaultHaulDistanceKm: template.defaultHaulDistanceKm,
      productionRateMPerDay: template.productionRateMPerDay,
      sourceNote: template.sourceNote,
      stageTemplates: template.stageTemplates.map((link) =>
        this.formatStageTemplate(link.stageTemplate, {
          sequence: link.sequence,
          startOffsetDays: link.startOffsetDays,
        }),
      ),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  private formatStageTemplate(
    stage: RoadWorkStageTemplateRecord,
    link?: { sequence?: number; startOffsetDays?: number },
  ): RoadWorkStageTemplateView {
    return {
      id: stage.id,
      type: stage.type,
      name: stage.name,
      sequence: link?.sequence ?? 0,
      startOffsetDays: link?.startOffsetDays ?? 0,
      durationDays: stage.durationDays,
      canOverlap: stage.canOverlap,
      notes: stage.notes,
      equipmentRules: stage.equipmentRules.map((rule) => ({
        id: rule.id,
        vehicleType: rule.vehicleType,
        calculationKind: rule.calculationKind,
        baseCount: rule.baseCount,
        countPerKm: rule.countPerKm,
        minCount: rule.minCount,
        maxCount: rule.maxCount,
        plannedHours: rule.plannedHours,
        priority: rule.priority,
        notes: rule.notes,
      })),
    };
  }

  private async findWorkTypeOrThrow(id: string) {
    const template = await this.prisma.roadWorkTypeTemplate.findUnique({
      where: { id },
      include: roadWorkTypeTemplateInclude,
    });
    if (!template) throw new NotFoundException('Вид дорожных работ не найден');
    return template;
  }

  private async findStageTemplateOrThrow(id: string) {
    const template = await this.prisma.roadWorkStageTemplate.findUnique({
      where: { id },
      include: roadWorkStageTemplateInclude,
    });
    if (!template) throw new NotFoundException('Шаблон этапа не найден');
    return template;
  }

  private async resolveStageTemplateIdsOrThrow(
    tx: Prisma.TransactionClient,
    stageTemplateIds?: string[],
  ) {
    if (stageTemplateIds && stageTemplateIds.length === 0) return [];

    const requestedIds = stageTemplateIds
      ? Array.from(new Set(stageTemplateIds))
      : (
          await tx.roadWorkStageTemplate.findMany({
            orderBy: [{ name: 'asc' }],
            select: { id: true },
          })
        ).map((stage) => stage.id);

    if (requestedIds.length === 0) return [];

    const existing = await tx.roadWorkStageTemplate.findMany({
      where: { id: { in: requestedIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((stage) => stage.id));
    const missing = requestedIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException('Один или несколько этапов из справочника не найдены');
    }

    return requestedIds;
  }

  private async replaceWorkTypeStageLinks(
    tx: Prisma.TransactionClient,
    workTypeId: string,
    stageTemplateIds: string[],
  ) {
    await tx.roadWorkTypeStageTemplate.deleteMany({ where: { workTypeId } });
    if (stageTemplateIds.length === 0) return;

    const stageRows = await tx.roadWorkStageTemplate.findMany({
      where: { id: { in: stageTemplateIds } },
      select: { id: true, durationDays: true },
    });
    const stageById = new Map(stageRows.map((stage) => [stage.id, stage]));
    let startOffsetDays = 0;

    await tx.roadWorkTypeStageTemplate.createMany({
      data: stageTemplateIds.map((stageTemplateId, index) => {
        const link = {
          workTypeId,
          stageTemplateId,
          sequence: index + 1,
          startOffsetDays,
        };
        startOffsetDays += stageById.get(stageTemplateId)?.durationDays ?? 1;
        return link;
      }),
    });
  }

  private normalizeDraftStages(
    template: RoadWorkTypeTemplateRecord,
    dto: GenerateEquipmentPlanDraftDto,
  ): EquipmentPlanDraftStageDto[] {
    if (dto.stages?.length) {
      return dto.stages
        .map((stage, index) => ({
          ...stage,
          sequence: stage.sequence ?? index + 1,
          startOffsetDays: stage.startOffsetDays ?? index,
          durationDays: stage.durationDays || 1,
          equipmentRules: stage.equipmentRules ?? [],
        }))
        .sort((a, b) => a.sequence - b.sequence);
    }

    return template.stageTemplates.map((link) => ({
      templateStageId: link.stageTemplate.id,
      type: link.stageTemplate.type,
      name: link.stageTemplate.name,
      sequence: link.sequence,
      startOffsetDays: link.startOffsetDays,
      durationDays: link.stageTemplate.durationDays,
      canOverlap: link.stageTemplate.canOverlap,
      notes: link.stageTemplate.notes,
      equipmentRules: link.stageTemplate.equipmentRules.map((rule) => ({
        vehicleType: rule.vehicleType,
        calculationKind: rule.calculationKind,
        baseCount: rule.baseCount,
        countPerKm: rule.countPerKm,
        minCount: rule.minCount,
        maxCount: rule.maxCount,
        plannedHours: rule.plannedHours,
        priority: rule.priority,
        notes: rule.notes,
      })),
    }));
  }

  private calculateRequiredCount(
    rule: EquipmentPlanDraftRuleDto,
    params: {
      lengthKm: number;
      haulDistanceKm: number;
      shiftHours: number;
      productionRateMPerDay: number;
    },
  ) {
    const calculationKind = rule.calculationKind ?? 'fixed';
    const baseCount = rule.baseCount ?? 1;
    const minCount = rule.minCount ?? 1;
    const maxCount = rule.maxCount ?? null;
    let calculated = baseCount;
    let calculationNote = 'Фиксированное механизированное звено по технологической карте.';

    if (calculationKind === 'per_km') {
      calculated = baseCount + (rule.countPerKm ?? 0) * params.lengthKm;
      calculationNote = `Расчёт по протяжённости: ${baseCount} базово + ${rule.countPerKm ?? 0} ед./км × ${params.lengthKm} км.`;
    }

    if (calculationKind === 'asphalt_delivery') {
      const loadingMinutes = 12;
      const unloadingMinutes = 8;
      const waitingReserveMinutes = 10;
      const averageSpeedKmh = 35;
      const truckIntervalMinutes = Math.max(10, 60 / Math.max(baseCount, 1));
      const travelMinutes =
        params.haulDistanceKm > 0
          ? (params.haulDistanceKm * 2 * 60) / averageSpeedKmh
          : 0;
      const cycleMinutes =
        loadingMinutes + unloadingMinutes + waitingReserveMinutes + travelMinutes;
      calculated = Math.ceil((cycleMinutes / truckIntervalMinutes) * 1.15);
      calculationNote =
        `Самосвалы рассчитаны по циклу доставки: ${Math.round(cycleMinutes)} мин оборот, ` +
        `${params.haulDistanceKm} км плечо, резерв потока 15%.`;
    }

    const bounded = Math.max(minCount, Math.ceil(calculated));
    const requiredCount = maxCount ? Math.min(bounded, maxCount) : bounded;

    return { requiredCount, calculationKind, calculationNote };
  }

  private buildDraftRisk(params: {
    requiredCount: number;
    availableCount: number;
    repairCount: number;
    conflictCount: number;
    withoutDriverCount: number;
    calculationKind: EquipmentCalculationKind;
  }) {
    const risks: string[] = [];
    const operationalAvailable = Math.max(
      params.availableCount - params.conflictCount,
      0,
    );

    if (operationalAvailable < params.requiredCount) {
      risks.push(
        `Дефицит ${params.requiredCount - operationalAvailable} ед. с учётом занятости в графике.`,
      );
    }
    if (params.repairCount > 0) {
      risks.push(
        `${params.repairCount} ед. нужного типа находится в ремонте или на ТО.`,
      );
    }
    if (params.conflictCount > 0) {
      risks.push(
        `${params.conflictCount} ед. уже занято в выбранные даты и смену.`,
      );
    }
    if (params.withoutDriverCount > 0) {
      risks.push(
        `${params.withoutDriverCount} ед. доступной техники без закреплённого водителя.`,
      );
    }
    if (params.calculationKind === 'asphalt_delivery') {
      risks.push(
        'Проверьте плечо доставки смеси: простой асфальтоукладчика критичен для качества покрытия.',
      );
    }

    const riskLevel: EquipmentPlanDraftDemandView['riskLevel'] =
      operationalAvailable < params.requiredCount
        ? 'high'
        : params.withoutDriverCount > 0 || params.repairCount > 0
          ? 'medium'
          : 'low';

    return { risks, riskLevel };
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

  async getWorkTypes(): Promise<RoadWorkTypeTemplateView[]> {
    const templates = await this.prisma.roadWorkTypeTemplate.findMany({
      include: roadWorkTypeTemplateInclude,
      orderBy: [{ name: 'asc' }],
    });
    return templates.map((template) => this.formatWorkType(template));
  }

  async getStageTemplates(): Promise<RoadWorkStageTemplateView[]> {
    const templates = await this.prisma.roadWorkStageTemplate.findMany({
      include: roadWorkStageTemplateInclude,
      orderBy: [{ name: 'asc' }],
    });
    return templates.map((template) => this.formatStageTemplate(template));
  }

  async createWorkType(
    dto: CreateRoadWorkTypeTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    const template = await this.prisma.$transaction(async (tx) => {
      const stageTemplateIds = await this.resolveStageTemplateIdsOrThrow(
        tx,
        dto.stageTemplateIds,
      );
      const created = await tx.roadWorkTypeTemplate.create({
        data: {
          code: dto.code.trim(),
          name: dto.name.trim(),
          description: dto.description?.trim() ?? '',
          defaultLengthKm: dto.defaultLengthKm,
          defaultWidthM: dto.defaultWidthM,
          defaultShiftHours: dto.defaultShiftHours,
          defaultHaulDistanceKm: dto.defaultHaulDistanceKm,
          productionRateMPerDay: dto.productionRateMPerDay,
          sourceNote: dto.sourceNote?.trim() ?? '',
        },
      });
      await this.replaceWorkTypeStageLinks(tx, created.id, stageTemplateIds);
      return tx.roadWorkTypeTemplate.findUniqueOrThrow({
        where: { id: created.id },
        include: roadWorkTypeTemplateInclude,
      });
    });
    return this.formatWorkType(template);
  }

  async updateWorkType(
    id: string,
    dto: UpdateRoadWorkTypeTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    await this.findWorkTypeOrThrow(id);
    const template = await this.prisma.$transaction(async (tx) => {
      await tx.roadWorkTypeTemplate.update({
        where: { id },
        data: {
          code: dto.code !== undefined ? dto.code.trim() : undefined,
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          description:
            dto.description !== undefined ? dto.description.trim() : undefined,
          defaultLengthKm: dto.defaultLengthKm,
          defaultWidthM: dto.defaultWidthM,
          defaultShiftHours: dto.defaultShiftHours,
          defaultHaulDistanceKm: dto.defaultHaulDistanceKm,
          productionRateMPerDay: dto.productionRateMPerDay,
          sourceNote:
            dto.sourceNote !== undefined ? dto.sourceNote.trim() : undefined,
        },
      });

      if (dto.stageTemplateIds !== undefined) {
        const stageTemplateIds = await this.resolveStageTemplateIdsOrThrow(
          tx,
          dto.stageTemplateIds,
        );
        await this.replaceWorkTypeStageLinks(tx, id, stageTemplateIds);
      }

      return tx.roadWorkTypeTemplate.findUniqueOrThrow({
        where: { id },
        include: roadWorkTypeTemplateInclude,
      });
    });
    return this.formatWorkType(template);
  }

  async removeWorkType(id: string): Promise<{ success: boolean }> {
    await this.findWorkTypeOrThrow(id);
    await this.prisma.roadWorkTypeTemplate.delete({ where: { id } });
    return { success: true };
  }

  async createStageTemplate(
    dto: CreateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkStageTemplateView> {
    const template = await this.prisma.roadWorkStageTemplate.create({
      data: {
        type: dto.type,
        name: dto.name.trim(),
        durationDays: dto.durationDays,
        canOverlap: dto.canOverlap ?? false,
        notes: dto.notes?.trim() ?? '',
        equipmentRules: {
          create: (dto.equipmentRules ?? []).map((rule) => ({
            vehicleType: rule.vehicleType,
            calculationKind: rule.calculationKind ?? 'fixed',
            baseCount: rule.baseCount ?? 1,
            countPerKm: rule.countPerKm ?? 0,
            minCount: rule.minCount ?? 1,
            maxCount: rule.maxCount ?? null,
            plannedHours: rule.plannedHours ?? 8,
            priority: rule.priority ?? 'normal',
            notes: rule.notes?.trim() ?? '',
          })),
        },
      },
      include: roadWorkStageTemplateInclude,
    });
    return this.formatStageTemplate(template);
  }

  async createStageTemplateForWorkType(
    workTypeId: string,
    dto: CreateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    await this.findWorkTypeOrThrow(workTypeId);
    const stage = await this.createStageTemplate(dto);
    const existingLinks = await this.prisma.roadWorkTypeStageTemplate.findMany({
      where: { workTypeId },
      orderBy: [{ sequence: 'asc' }],
      include: { stageTemplate: { select: { durationDays: true } } },
    });
    const startOffsetDays =
      dto.startOffsetDays ??
      existingLinks.reduce(
        (sum, link) => sum + link.stageTemplate.durationDays,
        0,
      );
    await this.prisma.roadWorkTypeStageTemplate.create({
      data: {
        workTypeId,
        stageTemplateId: stage.id,
        sequence: dto.sequence ?? existingLinks.length + 1,
        startOffsetDays,
      },
    });
    const template = await this.findWorkTypeOrThrow(workTypeId);
    return this.formatWorkType(template);
  }

  async updateStageTemplate(
    id: string,
    dto: UpdateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkStageTemplateView> {
    await this.findStageTemplateOrThrow(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.roadWorkStageTemplate.update({
        where: { id },
        data: {
          type: dto.type,
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          durationDays: dto.durationDays,
          canOverlap: dto.canOverlap,
          notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
        },
      });

      if (dto.equipmentRules) {
        await tx.roadWorkStageEquipmentTemplate.deleteMany({
          where: { stageTemplateId: id },
        });
        await tx.roadWorkStageEquipmentTemplate.createMany({
          data: dto.equipmentRules.map((rule) => ({
            stageTemplateId: id,
            vehicleType: rule.vehicleType,
            calculationKind: rule.calculationKind ?? 'fixed',
            baseCount: rule.baseCount ?? 1,
            countPerKm: rule.countPerKm ?? 0,
            minCount: rule.minCount ?? 1,
            maxCount: rule.maxCount ?? null,
            plannedHours: rule.plannedHours ?? 8,
            priority: rule.priority ?? 'normal',
            notes: rule.notes?.trim() ?? '',
          })),
        });
      }
    });

    const template = await this.findStageTemplateOrThrow(id);
    return this.formatStageTemplate(template);
  }

  async removeStageTemplate(id: string): Promise<{ success: boolean }> {
    await this.findStageTemplateOrThrow(id);
    await this.prisma.roadWorkStageTemplate.delete({ where: { id } });
    return { success: true };
  }

  async generateDraft(
    dto: GenerateEquipmentPlanDraftDto,
  ): Promise<EquipmentPlanDraftView> {
    const [site, template] = await Promise.all([
      this.assertSite(dto.siteId),
      this.findWorkTypeOrThrow(dto.workTypeId),
    ]);
    const draftStages = this.normalizeDraftStages(template, dto);
    const startDate = this.normalizeDate(dto.startDate);
    const maxEndDate = draftStages.reduce((latest, stage) => {
      const stageEnd = this.addDays(
        startDate,
        (stage.startOffsetDays ?? 0) + stage.durationDays - 1,
      );
      return stageEnd > latest ? stageEnd : latest;
    }, startDate);

    const [vehicles, existingPlans] = await Promise.all([
      this.prisma.fleetVehicle.findMany({
        select: {
          id: true,
          type: true,
          status: true,
          assignedDriverUserId: true,
        },
      }),
      this.prisma.equipmentPlanAssignment.findMany({
        where: {
          workDate: {
            gte: startDate,
            lte: maxEndDate,
          },
          shift: 'day',
          status: { not: 'failed' },
        },
        select: {
          vehicleId: true,
          workDate: true,
          vehicle: { select: { type: true } },
        },
      }),
    ]);

    const stages: EquipmentPlanDraftStageView[] = draftStages.map((stage) => {
      const stageStart = this.addDays(startDate, stage.startOffsetDays ?? 0);
      const stageEnd = this.addDays(stageStart, stage.durationDays - 1);
      const stageDateKeys = new Set(
        this.daysBetweenInclusive(stageStart, stageEnd).map((date) =>
          this.dateKey(date),
        ),
      );

      const demands: EquipmentPlanDraftDemandView[] = stage.equipmentRules.map(
        (rule) => {
          const { requiredCount, calculationKind, calculationNote } =
            this.calculateRequiredCount(rule, {
              lengthKm: dto.lengthKm,
              haulDistanceKm: dto.haulDistanceKm,
              shiftHours: dto.shiftHours,
              productionRateMPerDay: template.productionRateMPerDay,
            });

          const availableCount = vehicles.filter(
            (vehicle) =>
              vehicle.type === rule.vehicleType &&
              (vehicle.status === 'active' || vehicle.status === 'reserve'),
          ).length;
          const repairCount = vehicles.filter(
            (vehicle) =>
              vehicle.type === rule.vehicleType &&
              (vehicle.status === 'maintenance' || vehicle.status === 'repair'),
          ).length;
          const withoutDriverCount = vehicles.filter(
            (vehicle) =>
              vehicle.type === rule.vehicleType &&
              (vehicle.status === 'active' || vehicle.status === 'reserve') &&
              !vehicle.assignedDriverUserId,
          ).length;
          const conflictCount = new Set(
            existingPlans
              .filter(
                (plan) =>
                  plan.vehicle.type === rule.vehicleType &&
                  stageDateKeys.has(this.dateKey(plan.workDate)),
              )
              .map((plan) => plan.vehicleId),
          ).size;

          const { risks, riskLevel } = this.buildDraftRisk({
            requiredCount,
            availableCount,
            repairCount,
            conflictCount,
            withoutDriverCount,
            calculationKind,
          });

          return {
            vehicleType: rule.vehicleType,
            requiredCount,
            plannedHours: rule.plannedHours ?? dto.shiftHours,
            priority: rule.priority ?? 'normal',
            calculationKind,
            calculationNote,
            availableCount,
            repairCount,
            conflictCount,
            withoutDriverCount,
            riskLevel,
            risks,
            notes: rule.notes?.trim() ?? '',
          };
        },
      );

      return {
        templateStageId: stage.templateStageId ?? null,
        type: stage.type,
        name: stage.name.trim(),
        sequence: stage.sequence,
        startOffsetDays: stage.startOffsetDays ?? 0,
        durationDays: stage.durationDays,
        startDate: stageStart.toISOString(),
        endDate: stageEnd.toISOString(),
        canOverlap: stage.canOverlap ?? false,
        notes: stage.notes?.trim() ?? '',
        demands,
      };
    });

    const totalDemands = stages.reduce(
      (sum, stage) => sum + stage.demands.length,
      0,
    );
    const totalRequiredUnits = stages.reduce(
      (sum, stage) =>
        sum +
        stage.demands.reduce(
          (demandSum, demand) => demandSum + demand.requiredCount,
          0,
        ),
      0,
    );
    const criticalRisks = stages.reduce(
      (sum, stage) =>
        sum +
        stage.demands.filter((demand) => demand.riskLevel === 'high').length,
      0,
    );
    const plannedAssignments = stages.reduce((sum, stage) => {
      const stageDays = this.daysBetweenInclusive(
        new Date(stage.startDate),
        new Date(stage.endDate),
      ).length;
      return (
        sum +
        stage.demands.reduce(
          (demandSum, demand) =>
            demandSum + demand.requiredCount * stageDays,
          0,
        )
      );
    }, 0);

    return {
      siteId: site.id,
      siteName: site.name,
      workTypeId: template.id,
      workTypeName: template.name,
      startDate: startDate.toISOString(),
      lengthKm: dto.lengthKm,
      widthM: dto.widthM,
      shiftHours: dto.shiftHours,
      haulDistanceKm: dto.haulDistanceKm,
      stages,
      summary: {
        totalStages: stages.length,
        totalDemands,
        totalRequiredUnits,
        criticalRisks,
        plannedAssignments,
      },
    };
  }

  async applyDraft(
    dto: ApplyEquipmentPlanDraftDto,
    createdById: string,
  ): Promise<AppliedEquipmentPlanDraftView> {
    const draft = await this.generateDraft(dto);
    const createAssignments = dto.createAssignments ?? true;
    const selectedAssignments = new Map<string, string[]>(
      (dto.selectedAssignments ?? []).map((item) => [
        `${item.stageSequence}:${item.vehicleType}`,
        item.vehicleIds,
      ]),
    );
    let createdDemands = 0;
    let createdAssignments = 0;
    let skippedAssignments = 0;

    const eligibleVehicles = await this.prisma.fleetVehicle.findMany({
      where: { status: { in: ['active', 'reserve'] } },
      orderBy: [
        { assignedDriverUserId: 'asc' },
        { status: 'asc' },
        { plateNumber: 'asc' },
      ],
      select: {
        id: true,
        type: true,
        brand: true,
        model: true,
        plateNumber: true,
        assignedDriverUserId: true,
      },
    });

    const occupied = new Set<string>();
    const existingPlans = await this.prisma.equipmentPlanAssignment.findMany({
      where: {
        siteId: dto.replaceExisting ? { not: draft.siteId } : undefined,
        workDate: {
          gte: new Date(draft.startDate),
          lte: draft.stages.reduce((latest, stage) => {
            const endDate = new Date(stage.endDate);
            return endDate > latest ? endDate : latest;
          }, new Date(draft.startDate)),
        },
        shift: 'day',
        status: { not: 'failed' },
      },
      select: { vehicleId: true, workDate: true, shift: true },
    });
    existingPlans.forEach((plan) => {
      occupied.add(this.planSlotKey(plan.vehicleId, plan.workDate, plan.shift));
    });

    await this.prisma.$transaction(async (tx) => {
      if (dto.replaceExisting) {
        await tx.equipmentPlanAssignment.deleteMany({
          where: { siteId: draft.siteId },
        });
        await tx.equipmentDemand.deleteMany({
          where: { siteId: draft.siteId },
        });
        await tx.roadWorkStage.deleteMany({
          where: { siteId: draft.siteId },
        });
      }

      for (const stage of draft.stages) {
        const createdStage = await tx.roadWorkStage.create({
          data: {
            siteId: draft.siteId,
            type: stage.type,
            name: stage.name,
            startDate: new Date(stage.startDate),
            endDate: new Date(stage.endDate),
            status: 'planned',
            notes:
              stage.notes ||
              `Создано мастером планирования по виду работ "${draft.workTypeName}".`,
          },
        });

        for (const demand of stage.demands) {
          const createdDemand = await tx.equipmentDemand.create({
            data: {
              siteId: draft.siteId,
              stageId: createdStage.id,
              vehicleType: demand.vehicleType,
              requiredCount: demand.requiredCount,
              plannedHours: demand.plannedHours,
              priority: demand.priority,
              notes: `${demand.calculationNote}${demand.notes ? ` ${demand.notes}` : ''}`,
            },
          });
          createdDemands += 1;

          if (!createAssignments) continue;

          for (const workDate of this.daysBetweenInclusive(
            new Date(stage.startDate),
            new Date(stage.endDate),
          )) {
            const selectedVehicleIds = selectedAssignments.get(
              `${stage.sequence}:${demand.vehicleType}`,
            );
            const sourceVehicles = selectedVehicleIds?.length
              ? eligibleVehicles.filter(
                  (vehicle) =>
                    selectedVehicleIds.includes(vehicle.id) &&
                    vehicle.type === demand.vehicleType,
                )
              : eligibleVehicles
                  .filter((vehicle) => vehicle.type === demand.vehicleType)
                  .sort((a, b) => {
                    if (a.assignedDriverUserId && !b.assignedDriverUserId) return -1;
                    if (!a.assignedDriverUserId && b.assignedDriverUserId) return 1;
                    return a.id.localeCompare(b.id);
                  });

            if (selectedVehicleIds?.length) {
              const missingSelected = selectedVehicleIds.filter(
                (id) => !sourceVehicles.some((vehicle) => vehicle.id === id),
              );
              if (missingSelected.length > 0) {
                throw new ConflictException(
                  'Выбранная техника недоступна, находится не в рабочем статусе или не соответствует требуемому типу.',
                );
              }

              const busySelected = sourceVehicles.filter((vehicle) =>
                occupied.has(this.planSlotKey(vehicle.id, workDate, 'day')),
              );
              if (busySelected.length > 0) {
                const busyLabels = busySelected
                  .map(
                    (vehicle) =>
                      `${vehicle.brand} ${vehicle.model} ${vehicle.plateNumber}`,
                  )
                  .join(', ');
                throw new ConflictException(
                  `Выбранная техника уже занята ${this.dateKey(workDate)}: ${busyLabels}. Выберите другую технику или сдвиньте этап.`,
                );
              }
            }

            const assignedForDate = sourceVehicles
              .filter((vehicle) => {
                const key = this.planSlotKey(vehicle.id, workDate, 'day');
                return !occupied.has(key);
              })
              .slice(0, demand.requiredCount);

            skippedAssignments += Math.max(
              demand.requiredCount - assignedForDate.length,
              0,
            );

            for (const vehicle of assignedForDate) {
              const key = this.planSlotKey(vehicle.id, workDate, 'day');
              occupied.add(key);
              await tx.equipmentPlanAssignment.create({
                data: {
                  siteId: draft.siteId,
                  stageId: createdStage.id,
                  demandId: createdDemand.id,
                  vehicleId: vehicle.id,
                  workDate,
                  shift: 'day',
                  plannedHours: demand.plannedHours,
                  status: 'planned',
                  notes: `Автоматическое назначение по мастеру: ${stage.name}.`,
                  createdById,
                },
              });
              createdAssignments += 1;
            }
          }
        }
      }
    });

    return {
      createdStages: draft.stages.length,
      createdDemands,
      createdAssignments,
      skippedAssignments,
      draft,
    };
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
