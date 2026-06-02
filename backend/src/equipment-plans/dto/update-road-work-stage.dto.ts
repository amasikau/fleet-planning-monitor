import { RoadWorkStageStatus, RoadWorkStageType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateRoadWorkStageDto {
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsEnum(RoadWorkStageType)
  type?: RoadWorkStageType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(RoadWorkStageStatus)
  status?: RoadWorkStageStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
