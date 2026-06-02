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
import { CreateEquipmentDemandDto } from './dto/create-equipment-demand.dto';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { CreateRoadWorkStageDto } from './dto/create-road-work-stage.dto';
import { UpdateEquipmentDemandDto } from './dto/update-equipment-demand.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';
import { UpdateRoadWorkStageDto } from './dto/update-road-work-stage.dto';
import {
  EquipmentCoverageView,
  EquipmentDemandView,
  EquipmentPlanStatsView,
  EquipmentPlanView,
  EquipmentPlansService,
  RoadWorkStageView,
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

  @Get('stages')
  async getStages(@Query('siteId') siteId?: string): Promise<RoadWorkStageView[]> {
    return this.equipmentPlansService.getStages({ siteId });
  }

  @Get('demands')
  async getDemands(
    @Query('siteId') siteId?: string,
  ): Promise<EquipmentDemandView[]> {
    return this.equipmentPlansService.getDemands({ siteId });
  }

  @Get('coverage')
  async getCoverage(
    @Query('siteId') siteId?: string,
  ): Promise<EquipmentCoverageView[]> {
    return this.equipmentPlansService.getCoverage({ siteId });
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
  @Post('stages')
  async createStage(
    @Body() dto: CreateRoadWorkStageDto,
  ): Promise<RoadWorkStageView> {
    return this.equipmentPlansService.createStage(dto);
  }

  @Roles('admin', 'moderator')
  @Put('stages/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateRoadWorkStageDto,
  ): Promise<RoadWorkStageView> {
    return this.equipmentPlansService.updateStage(id, dto);
  }

  @Roles('admin', 'moderator')
  @Delete('stages/:id')
  async removeStage(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.equipmentPlansService.removeStage(id);
  }

  @Roles('admin', 'moderator')
  @Post('demands')
  async createDemand(
    @Body() dto: CreateEquipmentDemandDto,
  ): Promise<EquipmentDemandView> {
    return this.equipmentPlansService.createDemand(dto);
  }

  @Roles('admin', 'moderator')
  @Put('demands/:id')
  async updateDemand(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDemandDto,
  ): Promise<EquipmentDemandView> {
    return this.equipmentPlansService.updateDemand(id, dto);
  }

  @Roles('admin', 'moderator')
  @Delete('demands/:id')
  async removeDemand(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.equipmentPlansService.removeDemand(id);
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
