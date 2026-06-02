import { IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DrivingCategory } from '@prisma/client';
import { DocumentDto } from './assign-driver.dto';

export class UpdateDriverDto {
  @IsArray()
  @IsOptional()
  @IsEnum(DrivingCategory, { each: true })
  categories?: DrivingCategory[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];
}
