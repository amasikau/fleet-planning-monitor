import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { FleetServiceEventType } from '@prisma/client';

export class CreateServiceEventDto {
  @IsString()
  vehicleId: string;

  @IsEnum(FleetServiceEventType)
  type: FleetServiceEventType;

  @IsString()
  title: string;

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
