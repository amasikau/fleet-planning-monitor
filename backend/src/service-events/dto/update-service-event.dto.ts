import {
  IsArray,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FleetServiceEventStatus, FleetServiceEventType } from '@prisma/client';

export class ServiceWorkLogDto {
  @IsDateString()
  performedAt: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  mileageKm?: number | null;
}

export class UpdateServiceEventDto {
  @IsEnum(FleetServiceEventType)
  @IsOptional()
  type?: FleetServiceEventType;

  @IsEnum(FleetServiceEventStatus)
  @IsOptional()
  status?: FleetServiceEventStatus;

  @IsString()
  @IsOptional()
  repairTemplateId?: string | null;

  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  durationDays?: number | null;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string | null;

  @IsInt()
  @IsOptional()
  mileageKm?: number | null;

  @IsString()
  @IsOptional()
  defectDescription?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceWorkLogDto)
  @IsOptional()
  workLogs?: ServiceWorkLogDto[];
}
