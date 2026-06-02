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

const fleetAssignedDriverSelect = {
  user: {
    select: {
      id: true,
      username: true,
      lastName: true,
      firstName: true,
      middleName: true,
    },
  },
} satisfies Prisma.DriverInclude;

const fleetVehicleInclude = {
  assignedDriver: {
    include: fleetAssignedDriverSelect,
  },
} satisfies Prisma.FleetVehicleInclude;

type FleetVehicleRecord = Prisma.FleetVehicleGetPayload<{
  include: typeof fleetVehicleInclude;
}>;

type FleetDriverRecord = Prisma.DriverGetPayload<{
  include: typeof fleetAssignedDriverSelect;
}>;

export type FleetVehicleViewStatus = 'active' | 'reserve' | 'repair';

export interface FleetAssignedDriverSummary {
  userId: string;
  username: string;
  fullName: string;
}

export interface FleetVehicleView {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  type: FleetVehicleType;
  status: FleetVehicleViewStatus;
  notes: string;
  assignedDriver: FleetAssignedDriverSummary | null;
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

  private formatDriver(
    driver: FleetDriverRecord | null,
  ): FleetAssignedDriverSummary | null {
    if (!driver) {
      return null;
    }

    return {
      userId: driver.userId,
      username: driver.user.username,
      fullName: [
        driver.user.lastName,
        driver.user.firstName,
        driver.user.middleName,
      ]
        .filter(Boolean)
        .join(' '),
    };
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
      assignedDriver: this.formatDriver(vehicle.assignedDriver),
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }

  private async getAssignedDriver(userId?: string | null) {
    if (!userId) {
      return null;
    }

    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: fleetAssignedDriverSelect,
    });

    if (!driver) {
      throw new NotFoundException('Водитель не найден');
    }

    return driver;
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
      return await this.prisma.fleetVehicle.create({
        data: input,
        include: fleetVehicleInclude,
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
        include: fleetVehicleInclude,
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
      include: fleetVehicleInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return vehicles.map((vehicle) => this.formatVehicle(vehicle));
  }

  async create(
    dto: CreateFleetVehicleDto,
    performedById: string,
  ): Promise<FleetVehicleView> {
    const assignedDriver = await this.getAssignedDriver(
      dto.assignedDriverUserId,
    );
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
      status: dto.status,
      notes: dto.notes ?? '',
      assignedDriverUserId: assignedDriver?.userId ?? null,
    });

    await this.createAuditLog({
      action: 'create',
      targetVehicleId: vehicle.id,
      vehicleLabel,
      performedById,
      details: `Создана единица техники ${vehicleLabel}`,
    });

    if (assignedDriver) {
      await this.createAuditLog({
        action: 'assign_driver',
        targetVehicleId: vehicle.id,
        vehicleLabel,
        performedById,
        details: `Закреплён водитель ${this.formatDriver(assignedDriver)?.fullName}`,
      });
    }

    return this.formatVehicle(vehicle);
  }

  async update(
    id: string,
    dto: UpdateFleetVehicleDto,
    performedById: string,
  ): Promise<FleetVehicleView> {
    const existing: FleetVehicleRecord | null =
      await this.prisma.fleetVehicle.findUnique({
        where: { id },
        include: fleetVehicleInclude,
      });

    if (!existing) {
      throw new NotFoundException('Транспорт не найден');
    }

    const nextBrand = dto.brand ?? existing.brand;
    const nextModel = dto.model ?? existing.model;
    const nextPlateNumber = dto.plateNumber ?? existing.plateNumber;
    const nextStatus = dto.status ?? existing.status;

    const driverFieldProvided = 'assignedDriverUserId' in dto;
    const assignedDriver: FleetDriverRecord | null = driverFieldProvided
      ? await this.getAssignedDriver(dto.assignedDriverUserId ?? null)
      : existing.assignedDriver;

    const updated = await this.updateVehicle(id, {
      brand: dto.brand,
      model: dto.model,
      name: dto.brand || dto.model ? `${nextBrand} ${nextModel}` : undefined,
      plateNumber: dto.plateNumber,
      status: dto.status,
      notes: dto.notes,
      assignedDriverUserId: driverFieldProvided
        ? (assignedDriver?.userId ?? null)
        : undefined,
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

    if (driverFieldProvided) {
      const previousDriver = this.formatDriver(existing.assignedDriver);
      const nextDriver = this.formatDriver(assignedDriver);

      if (!previousDriver && nextDriver) {
        await this.createAuditLog({
          action: 'assign_driver',
          targetVehicleId: updated.id,
          vehicleLabel,
          performedById,
          details: `Закреплён водитель ${nextDriver.fullName}`,
        });
      } else if (previousDriver && !nextDriver) {
        await this.createAuditLog({
          action: 'unassign_driver',
          targetVehicleId: updated.id,
          vehicleLabel,
          performedById,
          details: `Откреплён водитель ${previousDriver.fullName}`,
        });
      } else if (
        previousDriver &&
        nextDriver &&
        previousDriver.userId !== nextDriver.userId
      ) {
        await this.createAuditLog({
          action: 'assign_driver',
          targetVehicleId: updated.id,
          vehicleLabel,
          performedById,
          details: `Сменён водитель: ${previousDriver.fullName} -> ${nextDriver.fullName}`,
        });
      }
    }

    return this.formatVehicle(updated);
  }

  async remove(
    id: string,
    performedById: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.fleetVehicle.findUnique({
      where: { id },
      include: fleetVehicleInclude,
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
    if (status === 'active') return 'В работе';
    if (status === 'reserve') return 'Не используется';
    return 'В ремонте';
  }
}
