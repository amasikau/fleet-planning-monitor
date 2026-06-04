import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FleetVehicleType, MechanicDocType } from '@prisma/client';

export class MechanicDocumentDto {
  @IsEnum(MechanicDocType)
  type: MechanicDocType;

  @IsString()
  fileName: string;

  @IsString()
  @IsOptional()
  filePath?: string;
}

export class AssignMechanicDto {
  @IsString()
  userId: string;

  @IsArray()
  @IsEnum(FleetVehicleType, { each: true })
  vehicleTypes: FleetVehicleType[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MechanicDocumentDto)
  documents?: MechanicDocumentDto[];
}
