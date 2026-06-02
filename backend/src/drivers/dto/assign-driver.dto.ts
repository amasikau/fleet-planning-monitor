import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DrivingCategory, DriverDocType } from '@prisma/client';

export class DocumentDto {
  @IsEnum(DriverDocType)
  type: DriverDocType;

  @IsString()
  fileName: string;

  @IsString()
  @IsOptional()
  filePath?: string;
}

export class AssignDriverDto {
  @IsString()
  userId: string;

  @IsArray()
  @IsEnum(DrivingCategory, { each: true })
  categories: DrivingCategory[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];
}
