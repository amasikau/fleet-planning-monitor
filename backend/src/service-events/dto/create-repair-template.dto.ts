import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  FleetRepairCategory,
  FleetServiceEventType,
  FleetVehicleType,
} from '@prisma/client';

export class CreateRepairTemplateDto {
  @IsEnum(FleetVehicleType)
  vehicleType: FleetVehicleType;

  @IsEnum(FleetServiceEventType)
  serviceEventType: FleetServiceEventType;

  @IsEnum(FleetRepairCategory)
  category: FleetRepairCategory;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  durationDays: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
