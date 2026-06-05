import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RoadWorkStageType } from '@prisma/client';
import { RoadWorkStageEquipmentTemplateDto } from './create-road-work-stage-template.dto';

export class UpdateRoadWorkStageTemplateDto {
  @IsOptional()
  @IsEnum(RoadWorkStageType)
  type?: RoadWorkStageType;

  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

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
