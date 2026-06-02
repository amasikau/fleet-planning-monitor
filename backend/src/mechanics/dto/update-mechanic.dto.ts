import { IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MechanicSpecialization } from '@prisma/client';
import { MechanicDocumentDto } from './assign-mechanic.dto';

export class UpdateMechanicDto {
  @IsArray()
  @IsOptional()
  @IsEnum(MechanicSpecialization, { each: true })
  specializations?: MechanicSpecialization[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MechanicDocumentDto)
  documents?: MechanicDocumentDto[];
}
