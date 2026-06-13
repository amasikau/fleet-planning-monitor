import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FleetAuditAction,
  FleetVehicleStatus,
  FleetVehicleType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFleetVehicleDto } from './dto/create-fleet-vehicle.dto';
import { UpdateFleetVehicleDto } from './dto/update-fleet-vehicle.dto';

type FleetVehicleRecord = Prisma.FleetVehicleGetPayload<Record<string, never>>;

export type FleetVehicleViewStatus = 'active' | 'reserve' | 'repair';

export interface FleetVehicleView {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  type: FleetVehicleType;
  status: FleetVehicleViewStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FleetAuditLogEntry {
  id: string;
  timestamp: string;
  action: FleetAuditAction;
  vehicleLabel: string;
  performedBy: string;
  details: string;
}

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  private buildVehicleLabel(brand: string, model: string, plateNumber: string) {
    return `${brand} ${model} · ${plateNumber}`;
  }

  private mapStatus(status: FleetVehicleStatus): FleetVehicleViewStatus {
    return status === 'maintenance' ? 'repair' : status;
  }

  private formatVehicle(vehicle: FleetVehicleRecord): FleetVehicleView {
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      status: this.mapStatus(vehicle.status),
      notes: vehicle.notes,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }

  private async createAuditLog(data: {
    action: FleetAuditAction;
    targetVehicleId?: string | null;
    vehicleLabel: string;
    performedById: string;
    details: string;
  }) {
    await this.prisma.fleetAuditLog.create({
      data: {
        action: data.action,
        targetVehicleId: data.targetVehicleId ?? null,
        vehicleLabel: data.vehicleLabel,
        performedById: data.performedById,
        details: data.details,
      },
    });
  }

  private async createVehicle(
    input:
      | Prisma.FleetVehicleCreateInput
      | Prisma.FleetVehicleUncheckedCreateInput,
  ) {
    try {
      return await this.prisma.fleetVehicle.create({ data: input });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Техника с таким госномером уже существует',
        );
      }
      throw error;
    }
  }

  private async updateVehicle(
    id: string,
    input:
      | Prisma.FleetVehicleUpdateInput
      | Prisma.FleetVehicleUncheckedUpdateInput,
  ) {
    try {
      return await this.prisma.fleetVehicle.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Техника с таким госномером уже существует',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<FleetVehicleView[]> {
    const vehicles = await this.prisma.fleetVehicle.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return vehicles.map((vehicle) => this.formatVehicle(vehicle));
  }

  async create(
    dto: CreateFleetVehicleDto,
    performedById: string,
  ): Promise<FleetVehicleView> {
    const vehicleLabel = this.buildVehicleLabel(
      dto.brand,
      dto.model,
      dto.plateNumber,
    );

    const vehicle = await this.createVehicle({
      brand: dto.brand,
      model: dto.model,
      name: `${dto.brand} ${dto.model}`,
      plateNumber: dto.plateNumber,
      type: dto.type,
      status: dto.status,
      notes: dto.notes ?? '',
    });

    await this.createAuditLog({
      action: 'create',
      targetVehicleId: vehicle.id,
      vehicleLabel,
      performedById,
      details: `Создана единица техники ${vehicleLabel}`,
    });

    return this.formatVehicle(vehicle);
  }

  async update(
    id: string,
    dto: UpdateFleetVehicleDto,
    performedById: string,
  ): Promise<FleetVehicleView> {
    const existing = await this.prisma.fleetVehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Транспорт не найден');
    }

    const nextBrand = dto.brand ?? existing.brand;
    const nextModel = dto.model ?? existing.model;
    const nextPlateNumber = dto.plateNumber ?? existing.plateNumber;
    const nextStatus = dto.status ?? existing.status;

    const updated = await this.updateVehicle(id, {
      brand: dto.brand,
      model: dto.model,
      name: dto.brand || dto.model ? `${nextBrand} ${nextModel}` : undefined,
      plateNumber: dto.plateNumber,
      type: dto.type,
      status: dto.status,
      notes: dto.notes,
    });

    const vehicleLabel = this.buildVehicleLabel(
      nextBrand,
      nextModel,
      nextPlateNumber,
    );

    const editedFields: string[] = [];
    if (dto.brand && dto.brand !== existing.brand) editedFields.push('марка');
    if (dto.model && dto.model !== existing.model) editedFields.push('модель');
    if (dto.plateNumber && dto.plateNumber !== existing.plateNumber) {
      editedFields.push('госномер');
    }
    if (dto.type && dto.type !== existing.type) editedFields.push('тип техники');
    if (dto.notes !== undefined && dto.notes !== existing.notes) {
      editedFields.push('примечание');
    }

    if (editedFields.length > 0) {
      await this.createAuditLog({
        action: 'edit',
        targetVehicleId: updated.id,
        vehicleLabel,
        performedById,
        details: `Изменены данные техники: ${editedFields.join(', ')}`,
      });
    }

    if (dto.status && dto.status !== existing.status) {
      await this.createAuditLog({
        action: 'status_change',
        targetVehicleId: updated.id,
        vehicleLabel,
        performedById,
        details: `Статус изменён: ${this.getStatusLabel(this.mapStatus(existing.status))} -> ${this.getStatusLabel(this.mapStatus(nextStatus))}`,
      });
    }

    return this.formatVehicle(updated);
  }

  async remove(
    id: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.fleetVehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Транспорт не найден');
    }

    const vehicleLabel = this.buildVehicleLabel(
      existing.brand,
      existing.model,
      existing.plateNumber,
    );

    await this.createAuditLog({
      action: 'delete',
      targetVehicleId: existing.id,
      vehicleLabel,
      performedById,
      details: `Удалена единица техники ${vehicleLabel}`,
    });

    await this.prisma.fleetVehicle.delete({ where: { id } });

    return { success: true };
  }

  async getAuditLog(query: {
    search?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<FleetAuditLogEntry[]> {
    const where: Prisma.FleetAuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action as FleetAuditAction;
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const logs = await this.prisma.fleetAuditLog.findMany({
      where,
      include: {
        performedBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    let result = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      vehicleLabel: log.vehicleLabel,
      performedBy: log.performedBy.username,
      details: log.details,
    }));

    if (query.search) {
      const search = query.search.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.vehicleLabel.toLowerCase().includes(search) ||
          entry.performedBy.toLowerCase().includes(search) ||
          entry.details.toLowerCase().includes(search),
      );
    }

    return result;
  }

  private getStatusLabel(status: FleetVehicleViewStatus) {
    if (status === 'active') return 'Готова';
    if (status === 'reserve') return 'Не используется';
    return 'В ремонте';
  }
}
