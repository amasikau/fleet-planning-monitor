import { FleetVehicleStatus, FleetVehicleType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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
  @IsEnum(FleetVehicleType)
  type?: FleetVehicleType;

  @IsOptional()
  @IsEnum(FleetVehicleStatus)
  status?: FleetVehicleStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
