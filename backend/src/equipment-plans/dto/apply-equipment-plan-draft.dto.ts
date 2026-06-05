import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { FleetVehicleType } from '@prisma/client';
import { GenerateEquipmentPlanDraftDto } from './generate-equipment-plan-draft.dto';

export class SelectedEquipmentAssignmentDto {
  @IsInt()
  @Min(1)
  stageSequence: number;

  @IsEnum(FleetVehicleType)
  vehicleType: FleetVehicleType;

  @IsArray()
  @IsUUID(undefined, { each: true })
  vehicleIds: string[];
}

export class ApplyEquipmentPlanDraftDto extends GenerateEquipmentPlanDraftDto {
  @IsOptional()
  @IsBoolean()
  createAssignments?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedEquipmentAssignmentDto)
  selectedAssignments?: SelectedEquipmentAssignmentDto[];
}
