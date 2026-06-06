import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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

export class EquipmentPlanDraftRuleDto {
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

export class EquipmentPlanDraftStageDto {
  @IsOptional()
  @IsString()
  templateStageId?: string;

  @IsEnum(RoadWorkStageType)
  type: RoadWorkStageType;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sequence: number;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentPlanDraftRuleDto)
  equipmentRules: EquipmentPlanDraftRuleDto[];
}

export class GenerateEquipmentPlanDraftDto {
  @IsUUID()
  siteId: string;

  @IsUUID()
  workTypeId: string;

  @IsDateString()
  startDate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(200)
  lengthKm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(60)
  widthM: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  shiftHours: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  haulDistanceKm: number;

  @IsOptional()
  @IsBoolean()
  autoSchedule?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentPlanDraftStageDto)
  stages?: EquipmentPlanDraftStageDto[];
}
