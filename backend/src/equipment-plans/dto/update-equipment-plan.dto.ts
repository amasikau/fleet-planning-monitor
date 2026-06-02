import {
  EquipmentPlanShift,
  EquipmentPlanStatus,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateEquipmentPlanDto {
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string | null;

  @IsOptional()
  @IsUUID()
  demandId?: string | null;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsEnum(EquipmentPlanShift)
  shift?: EquipmentPlanShift;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  plannedHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24)
  actualHours?: number | null;

  @IsOptional()
  @IsEnum(EquipmentPlanStatus)
  status?: EquipmentPlanStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
