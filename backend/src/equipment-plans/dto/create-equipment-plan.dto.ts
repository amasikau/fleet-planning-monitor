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

export class CreateEquipmentPlanDto {
  @IsUUID()
  siteId: string;

  @IsUUID()
  vehicleId: string;

  @IsDateString()
  workDate: string;

  @IsEnum(EquipmentPlanShift)
  shift: EquipmentPlanShift;

  @IsInt()
  @Min(1)
  @Max(24)
  plannedHours: number;

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
