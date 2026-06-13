import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConstructionSiteAuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

export interface SiteVehicleView {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  plateNumber: string;
  assignedAt: string;
}

export interface ConstructionSiteView {
  id: string;
  name: string;
  workType: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  workPeriodStart: string;
  workPeriodEnd: string;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
  vehicleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionSiteDetailView extends ConstructionSiteView {
  vehicles: SiteVehicleView[];
}

export interface ConstructionSiteAuditLogEntry {
  id: string;
  timestamp: string;
  action: ConstructionSiteAuditAction;
  siteLabel: string;
  performedBy: string;
  details: string;
}

export interface AvailableVehicleView {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
}

const siteListInclude = {
  _count: { select: { vehicles: true, equipmentPlans: true, workStages: true } },
} satisfies Prisma.ConstructionSiteInclude;

const siteDetailInclude = {
  _count: { select: { vehicles: true, equipmentPlans: true, workStages: true } },
  vehicles: {
    include: {
      vehicle: true,
    },
    orderBy: { assignedAt: 'desc' as const },
  },
} satisfies Prisma.ConstructionSiteInclude;

type SiteListRecord = Prisma.ConstructionSiteGetPayload<{
  include: typeof siteListInclude;
}>;
type SiteDetailRecord = Prisma.ConstructionSiteGetPayload<{
  include: typeof siteDetailInclude;
}>;

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  private formatSite(site: SiteListRecord): ConstructionSiteView {
    const hasPlannedWork =
      site._count.equipmentPlans > 0 || site._count.workStages > 0;

    return {
      id: site.id,
      name: site.name,
      workType: hasPlannedWork ? site.workType : '',
      city: site.city,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      workPeriodStart: site.workPeriodStart.toISOString(),
      workPeriodEnd: site.workPeriodEnd.toISOString(),
      isCompleted: site.isCompleted,
      completedAt: site.completedAt?.toISOString() ?? null,
      notes: site.notes,
      vehicleCount: site._count.equipmentPlans,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
    };
  }

  private formatSiteDetail(site: SiteDetailRecord): ConstructionSiteDetailView {
    return {
      ...this.formatSite(site as unknown as SiteListRecord),
      vehicleCount: site._count.equipmentPlans,
      vehicles: site.vehicles.map((sv) => ({
        id: sv.id,
        vehicleId: sv.vehicle.id,
        brand: sv.vehicle.brand,
        model: sv.vehicle.model,
        plateNumber: sv.vehicle.plateNumber,
        assignedAt: sv.assignedAt.toISOString(),
      })),
    };
  }

  private async createAuditLog(data: {
    action: ConstructionSiteAuditAction;
    targetSiteId?: string | null;
    siteLabel: string;
    performedById: string;
    details: string;
  }) {
    await this.prisma.constructionSiteAuditLog.create({
      data: {
        action: data.action,
        targetSiteId: data.targetSiteId ?? null,
        siteLabel: data.siteLabel,
        performedById: data.performedById,
        details: data.details,
      },
    });
  }

  async findAll(): Promise<ConstructionSiteView[]> {
    const sites = await this.prisma.constructionSite.findMany({
      where: { isCompleted: false },
      include: siteListInclude,
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
    });
    return sites.map((site) => this.formatSite(site));
  }

  async findArchived(): Promise<ConstructionSiteView[]> {
    const sites = await this.prisma.constructionSite.findMany({
      where: { isCompleted: true },
      include: siteListInclude,
      orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return sites.map((site) => this.formatSite(site));
  }

  async findOne(id: string): Promise<ConstructionSiteDetailView> {
    const site = await this.prisma.constructionSite.findUnique({
      where: { id },
      include: siteDetailInclude,
    });
    if (!site) throw new NotFoundException('Объект не найден');
    return this.formatSiteDetail(site);
  }

  async create(
    dto: CreateSiteDto,
    performedById: string,
  ): Promise<ConstructionSiteView> {
    const name = dto.name.trim();
    const workPeriodStart = dto.workPeriodStart
      ? new Date(dto.workPeriodStart)
      : new Date();
    const workPeriodEnd = dto.workPeriodEnd
      ? new Date(dto.workPeriodEnd)
      : workPeriodStart;
    const site = await this.prisma.constructionSite.create({
      data: {
        name,
        workType: dto.workType?.trim() || 'Планирование',
        city: dto.city?.trim() ?? '',
        address: dto.address?.trim() ?? '',
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        workPeriodStart,
        workPeriodEnd,
        notes: dto.notes?.trim() ?? '',
      },
      include: siteListInclude,
    });

    await this.createAuditLog({
      action: 'create',
      targetSiteId: site.id,
      siteLabel: name,
      performedById,
      details: `Создан объект «${name}»`,
    });

    return this.formatSite(site);
  }

  async update(
    id: string,
    dto: UpdateSiteDto,
    performedById: string,
  ): Promise<ConstructionSiteView> {
    const existing = await this.prisma.constructionSite.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Объект не найден');

    const updated = await this.prisma.constructionSite.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        address: dto.address?.trim(),
      },
      include: siteListInclude,
    });

    const editedFields: string[] = [];
    if (dto.name?.trim() && dto.name.trim() !== existing.name) {
      editedFields.push('название');
    }
    if (dto.address !== undefined && dto.address.trim() !== existing.address) {
      editedFields.push('адрес');
    }

    if (editedFields.length > 0) {
      await this.createAuditLog({
        action: 'edit',
        targetSiteId: updated.id,
        siteLabel: updated.name,
        performedById,
        details: `Изменены данные объекта: ${editedFields.join(', ')}`,
      });
    }

    return this.formatSite(updated);
  }

  async remove(
    id: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.constructionSite.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Объект не найден');

    await this.createAuditLog({
      action: 'delete',
      targetSiteId: existing.id,
      siteLabel: existing.name,
      performedById,
      details: `Удалён объект «${existing.name}»`,
    });

    await this.prisma.constructionSite.delete({ where: { id } });
    return { success: true };
  }

  async complete(
    id: string,
    performedById: string,
  ): Promise<ConstructionSiteView> {
    const existing = await this.prisma.constructionSite.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Объект не найден');
    if (existing.isCompleted) {
      throw new ConflictException('Объект уже завершён');
    }

    const site = await this.prisma.constructionSite.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
      include: siteListInclude,
    });

    await this.createAuditLog({
      action: 'complete',
      targetSiteId: site.id,
      siteLabel: site.name,
      performedById,
      details: `Объект «${site.name}» завершён`,
    });

    return this.formatSite(site);
  }

  async assignVehicle(
    siteId: string,
    vehicleId: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    void siteId;
    void vehicleId;
    void performedById;
    throw new ConflictException(
      'Ручное назначение техники отключено. Используйте план-график.',
    );
  }

  async unassignVehicle(
    siteId: string,
    vehicleId: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    void siteId;
    void vehicleId;
    void performedById;
    throw new ConflictException(
      'Ручное снятие техники отключено. Используйте план-график.',
    );
  }

  async getAvailableVehicles(siteId?: string): Promise<AvailableVehicleView[]> {
    const where: Prisma.FleetVehicleWhereInput = {
      status: { notIn: ['maintenance', 'repair'] },
    };
    if (siteId) {
      where.siteAssignments = { none: { siteId } };
    }

    const vehicles = await this.prisma.fleetVehicle.findMany({
      where,
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });

    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
    }));
  }

  async getAuditLog(query: {
    search?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<ConstructionSiteAuditLogEntry[]> {
    const where: Prisma.ConstructionSiteAuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action as ConstructionSiteAuditAction;
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const logs = await this.prisma.constructionSiteAuditLog.findMany({
      where,
      include: {
        performedBy: { select: { username: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    let result = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      siteLabel: log.siteLabel,
      performedBy: log.performedBy.username,
      details: log.details,
    }));

    if (query.search) {
      const search = query.search.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.siteLabel.toLowerCase().includes(search) ||
          entry.performedBy.toLowerCase().includes(search) ||
          entry.details.toLowerCase().includes(search),
      );
    }

    return result;
  }
}
