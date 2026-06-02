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

export class CreateEquipmentDemandDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  stageId?: string | null;

  @IsEnum(FleetVehicleType)
  vehicleType: FleetVehicleType;

  @IsInt()
  @Min(1)
  @Max(200)
  requiredCount: number;

  @IsInt()
  @Min(1)
  @Max(24)
  plannedHours: number;

  @IsOptional()
  @IsEnum(EquipmentDemandPriority)
  priority?: EquipmentDemandPriority;

  @IsOptional()
  @IsString()
  notes?: string;
}
