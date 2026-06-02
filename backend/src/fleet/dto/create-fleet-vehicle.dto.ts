import { FleetVehicleStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFleetVehicleDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  plateNumber: string;

  @IsEnum(FleetVehicleStatus)
  status: FleetVehicleStatus;

  @IsOptional()
  @IsUUID()
  assignedDriverUserId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
