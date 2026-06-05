import { IsBoolean, IsOptional } from 'class-validator';
import { GenerateEquipmentPlanDraftDto } from './generate-equipment-plan-draft.dto';

export class ApplyEquipmentPlanDraftDto extends GenerateEquipmentPlanDraftDto {
  @IsOptional()
  @IsBoolean()
  createAssignments?: boolean;
}
