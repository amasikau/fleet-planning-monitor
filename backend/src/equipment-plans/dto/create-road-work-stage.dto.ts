import { RoadWorkStageStatus, RoadWorkStageType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoadWorkStageDto {
  @IsUUID()
  siteId: string;

  @IsEnum(RoadWorkStageType)
  type: RoadWorkStageType;

  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(RoadWorkStageStatus)
  status?: RoadWorkStageStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
