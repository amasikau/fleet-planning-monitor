import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';
import {
  EquipmentPlanStatsView,
  EquipmentPlanView,
  EquipmentPlansService,
} from './equipment-plans.service';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('equipment-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentPlansController {
  constructor(private readonly equipmentPlansService: EquipmentPlansService) {}

  @Get('stats')
  async getStats(): Promise<EquipmentPlanStatsView> {
    return this.equipmentPlansService.getStats();
  }

  @Get()
  async findAll(
    @Query('siteId') siteId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<EquipmentPlanView[]> {
    return this.equipmentPlansService.findAll({
      siteId,
      vehicleId,
      status,
      from,
      to,
    });
  }

  @Roles('admin', 'moderator')
  @Post()
  async create(
    @Body() dto: CreateEquipmentPlanDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<EquipmentPlanView> {
    return this.equipmentPlansService.create(dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentPlanDto,
  ): Promise<EquipmentPlanView> {
    return this.equipmentPlansService.update(id, dto);
  }

  @Roles('admin', 'moderator')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.equipmentPlansService.remove(id);
  }
}
