import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EquipmentCalculationKind,
  EquipmentDemandPriority,
  FleetVehicleType,
  RoadWorkStageType,
} from '@prisma/client';

export class RoadWorkStageEquipmentTemplateDto {
  @IsEnum(FleetVehicleType)
  vehicleType: FleetVehicleType;

  @IsOptional()
  @IsEnum(EquipmentCalculationKind)
  calculationKind?: EquipmentCalculationKind;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  baseCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  countPerKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  minCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxCount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  plannedHours?: number;

  @IsOptional()
  @IsEnum(EquipmentDemandPriority)
  priority?: EquipmentDemandPriority;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoadWorkStageTemplateDto {
  @IsEnum(RoadWorkStageType)
  type: RoadWorkStageType;

  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sequence?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  startOffsetDays?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsOptional()
  @IsBoolean()
  canOverlap?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoadWorkStageEquipmentTemplateDto)
  equipmentRules?: RoadWorkStageEquipmentTemplateDto[];
}
