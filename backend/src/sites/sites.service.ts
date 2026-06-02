import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConstructionSiteAuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

/* ── View interfaces ── */

export interface SiteVehicleView {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  plateNumber: string;
  driver: { userId: string; fullName: string } | null;
  assignedAt: string;
}

export interface ConstructionSiteView {
  id: string;
  name: string;
  workType: string;
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
  driver: { userId: string; fullName: string } | null;
}

/* ── Prisma includes ── */

const siteListInclude = {
  _count: { select: { vehicles: true } },
} satisfies Prisma.ConstructionSiteInclude;

const siteDetailInclude = {
  _count: { select: { vehicles: true } },
  vehicles: {
    include: {
      vehicle: {
        include: {
          assignedDriver: {
            include: {
              user: {
                select: {
                  lastName: true,
                  firstName: true,
                  middleName: true,
                },
              },
            },
          },
        },
      },
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

  /* ── Formatters ── */

  private formatSite(site: SiteListRecord): ConstructionSiteView {
    return {
      id: site.id,
      name: site.name,
      workType: site.workType,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      workPeriodStart: site.workPeriodStart.toISOString(),
      workPeriodEnd: site.workPeriodEnd.toISOString(),
      isCompleted: site.isCompleted,
      completedAt: site.completedAt?.toISOString() ?? null,
      notes: site.notes,
      vehicleCount: site._count.vehicles,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
    };
  }

  private formatSiteDetail(site: SiteDetailRecord): ConstructionSiteDetailView {
    return {
      ...this.formatSite(site as unknown as SiteListRecord),
      vehicleCount: site._count.vehicles,
      vehicles: site.vehicles.map((sv) => {
        const driver = sv.vehicle.assignedDriver;
        return {
          id: sv.id,
          vehicleId: sv.vehicle.id,
          brand: sv.vehicle.brand,
          model: sv.vehicle.model,
          plateNumber: sv.vehicle.plateNumber,
          driver: driver
            ? {
                userId: driver.userId,
                fullName: [
                  driver.user.lastName,
                  driver.user.firstName,
                  driver.user.middleName,
                ]
                  .filter(Boolean)
                  .join(' '),
              }
            : null,
          assignedAt: sv.assignedAt.toISOString(),
        };
      }),
    };
  }

  /* ── Audit helper ── */

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

  /* ── CRUD ── */

  async findAll(): Promise<ConstructionSiteView[]> {
    const sites = await this.prisma.constructionSite.findMany({
      where: { isCompleted: false },
      include: siteListInclude,
      orderBy: [{ workPeriodEnd: 'asc' }, { updatedAt: 'desc' }],
    });
    return sites.map((s) => this.formatSite(s));
  }

  async findArchived(): Promise<ConstructionSiteView[]> {
    const sites = await this.prisma.constructionSite.findMany({
      where: { isCompleted: true },
      include: siteListInclude,
      orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return sites.map((s) => this.formatSite(s));
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
    const site = await this.prisma.constructionSite.create({
      data: {
        name,
        workType: dto.workType?.trim() ?? '',
        address: dto.address?.trim() ?? '',
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        workPeriodStart: new Date(dto.workPeriodStart),
        workPeriodEnd: new Date(dto.workPeriodEnd),
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
        workType: dto.workType?.trim(),
        address: dto.address?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        workPeriodStart: dto.workPeriodStart
          ? new Date(dto.workPeriodStart)
          : undefined,
        workPeriodEnd: dto.workPeriodEnd
          ? new Date(dto.workPeriodEnd)
          : undefined,
        notes: dto.notes !== undefined ? dto.notes.trim() : undefined,
      },
      include: siteListInclude,
    });

    const editedFields: string[] = [];
    if (dto.name?.trim() && dto.name.trim() !== existing.name)
      editedFields.push('название');
    if (dto.workType !== undefined && dto.workType.trim() !== existing.workType)
      editedFields.push('вид работ');
    if (dto.address !== undefined && dto.address.trim() !== existing.address)
      editedFields.push('адрес');
    if (dto.latitude !== undefined && dto.latitude !== existing.latitude)
      editedFields.push('широта');
    if (dto.longitude !== undefined && dto.longitude !== existing.longitude)
      editedFields.push('долгота');
    if (
      dto.workPeriodStart &&
      new Date(dto.workPeriodStart).toISOString() !==
        existing.workPeriodStart.toISOString()
    )
      editedFields.push('начало периода');
    if (
      dto.workPeriodEnd &&
      new Date(dto.workPeriodEnd).toISOString() !==
        existing.workPeriodEnd.toISOString()
    )
      editedFields.push('конец периода');
    if (dto.notes !== undefined && dto.notes.trim() !== existing.notes)
      editedFields.push('примечание');

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
    if (existing.isCompleted)
      throw new ConflictException('Объект уже завершён');

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

  /* ── Vehicle assignments ── */

  async assignVehicle(
    siteId: string,
    vehicleId: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    const site = await this.prisma.constructionSite.findUnique({
      where: { id: siteId },
    });
    if (!site) throw new NotFoundException('Объект не найден');

    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Транспорт не найден');

    const exists = await this.prisma.siteVehicle.findUnique({
      where: { siteId_vehicleId: { siteId, vehicleId } },
    });
    if (exists)
      throw new ConflictException('Транспорт уже назначен на этот объект');

    await this.prisma.siteVehicle.create({ data: { siteId, vehicleId } });

    await this.createAuditLog({
      action: 'assign_vehicle',
      targetSiteId: siteId,
      siteLabel: site.name,
      performedById,
      details: `Назначена техника: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
    });

    return { success: true };
  }

  async unassignVehicle(
    siteId: string,
    vehicleId: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    const site = await this.prisma.constructionSite.findUnique({
      where: { id: siteId },
    });
    if (!site) throw new NotFoundException('Объект не найден');

    const vehicle = await this.prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Транспорт не найден');

    const assignment = await this.prisma.siteVehicle.findUnique({
      where: { siteId_vehicleId: { siteId, vehicleId } },
    });
    if (!assignment) throw new NotFoundException('Назначение не найдено');

    await this.prisma.siteVehicle.delete({ where: { id: assignment.id } });

    await this.createAuditLog({
      action: 'unassign_vehicle',
      targetSiteId: siteId,
      siteLabel: site.name,
      performedById,
      details: `Снята техника: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
    });

    return { success: true };
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
      include: {
        assignedDriver: {
          include: {
            user: {
              select: { lastName: true, firstName: true, middleName: true },
            },
          },
        },
      },
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });

    return vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      plateNumber: v.plateNumber,
      driver: v.assignedDriver
        ? {
            userId: v.assignedDriver.userId,
            fullName: [
              v.assignedDriver.user.lastName,
              v.assignedDriver.user.firstName,
              v.assignedDriver.user.middleName,
            ]
              .filter(Boolean)
              .join(' '),
          }
        : null,
    }));
  }

  /* ── Audit log ── */

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
