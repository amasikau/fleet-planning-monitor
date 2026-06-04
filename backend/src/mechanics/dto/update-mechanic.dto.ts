import { IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FleetVehicleType } from '@prisma/client';
import { MechanicDocumentDto } from './assign-mechanic.dto';

export class UpdateMechanicDto {
  @IsArray()
  @IsOptional()
  @IsEnum(FleetVehicleType, { each: true })
  vehicleTypes?: FleetVehicleType[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MechanicDocumentDto)
  documents?: MechanicDocumentDto[];
}
