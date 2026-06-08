import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsDateString()
  workPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  workPeriodEnd?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
