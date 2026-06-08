import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { FleetServiceEventType } from '@prisma/client';

export class CreateServiceEventDto {
  @IsString()
  vehicleId: string;

  @IsEnum(FleetServiceEventType)
  type: FleetServiceEventType;

  @IsString()
  @IsOptional()
  repairTemplateId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  durationDays?: number;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsString()
  @IsOptional()
  defectDescription?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
