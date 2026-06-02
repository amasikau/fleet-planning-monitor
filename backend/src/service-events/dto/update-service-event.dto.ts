import {
  IsArray,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FleetServiceEventStatus } from '@prisma/client';

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
  @IsEnum(FleetServiceEventStatus)
  @IsOptional()
  status?: FleetServiceEventStatus;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsString()
  @IsOptional()
  mechanicId?: string | null;

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
