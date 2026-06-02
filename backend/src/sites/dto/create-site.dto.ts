import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsDateString()
  workPeriodStart: string;

  @IsDateString()
  workPeriodEnd: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
