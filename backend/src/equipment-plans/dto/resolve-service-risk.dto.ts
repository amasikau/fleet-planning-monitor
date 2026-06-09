import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum ServiceRiskResolutionAction {
  replace = 'replace',
  shift = 'shift',
}

export class ResolveServiceRiskDto {
  @IsUUID()
  siteId: string;

  @IsEnum(ServiceRiskResolutionAction)
  action: ServiceRiskResolutionAction;

  @IsOptional()
  @IsUUID()
  replacementVehicleId?: string;
}
