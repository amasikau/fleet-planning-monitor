import { FleetVehicleStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFleetVehicleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsEnum(FleetVehicleStatus)
  status?: FleetVehicleStatus;

  @IsOptional()
  @IsUUID()
  assignedDriverUserId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
