import {
  EquipmentDemandPriority,
  FleetVehicleType,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateEquipmentDemandDto {
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string | null;

  @IsOptional()
  @IsEnum(FleetVehicleType)
  vehicleType?: FleetVehicleType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  requiredCount?: number;

  @IsOptional()
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
