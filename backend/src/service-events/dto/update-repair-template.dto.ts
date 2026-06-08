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

export class UpdateRepairTemplateDto {
  @IsOptional()
  @IsEnum(FleetVehicleType)
  vehicleType?: FleetVehicleType;

  @IsOptional()
  @IsEnum(FleetServiceEventType)
  serviceEventType?: FleetServiceEventType;

  @IsOptional()
  @IsEnum(FleetRepairCategory)
  category?: FleetRepairCategory;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  durationDays?: number;

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
