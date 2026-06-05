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
import { ApplyEquipmentPlanDraftDto } from './dto/apply-equipment-plan-draft.dto';
import { CreateEquipmentDemandDto } from './dto/create-equipment-demand.dto';
import { CreateEquipmentPlanDto } from './dto/create-equipment-plan.dto';
import { CreateRoadWorkStageDto } from './dto/create-road-work-stage.dto';
import { CreateRoadWorkStageTemplateDto } from './dto/create-road-work-stage-template.dto';
import { CreateRoadWorkTypeTemplateDto } from './dto/create-road-work-type-template.dto';
import { GenerateEquipmentPlanDraftDto } from './dto/generate-equipment-plan-draft.dto';
import { UpdateEquipmentDemandDto } from './dto/update-equipment-demand.dto';
import { UpdateEquipmentPlanDto } from './dto/update-equipment-plan.dto';
import { UpdateRoadWorkStageDto } from './dto/update-road-work-stage.dto';
import { UpdateRoadWorkStageTemplateDto } from './dto/update-road-work-stage-template.dto';
import { UpdateRoadWorkTypeTemplateDto } from './dto/update-road-work-type-template.dto';
import {
  AppliedEquipmentPlanDraftView,
  EquipmentCoverageView,
  EquipmentDemandView,
  EquipmentPlanDraftView,
  EquipmentPlanStatsView,
  EquipmentPlanView,
  EquipmentPlansService,
  RoadWorkTypeTemplateView,
  RoadWorkStageView,
  RoadWorkStageTemplateView,
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

  @Get('work-types')
  async getWorkTypes(): Promise<RoadWorkTypeTemplateView[]> {
    return this.equipmentPlansService.getWorkTypes();
  }

  @Get('stage-templates')
  async getStageTemplates(): Promise<RoadWorkStageTemplateView[]> {
    return this.equipmentPlansService.getStageTemplates();
  }

  @Roles('admin', 'moderator')
  @Post('work-types')
  async createWorkType(
    @Body() dto: CreateRoadWorkTypeTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    return this.equipmentPlansService.createWorkType(dto);
  }

  @Roles('admin', 'moderator')
  @Put('work-types/:id')
  async updateWorkType(
    @Param('id') id: string,
    @Body() dto: UpdateRoadWorkTypeTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    return this.equipmentPlansService.updateWorkType(id, dto);
  }

  @Roles('admin', 'moderator')
  @Delete('work-types/:id')
  async removeWorkType(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.equipmentPlansService.removeWorkType(id);
  }

  @Roles('admin', 'moderator')
  @Post('work-types/:id/stages')
  async createStageTemplate(
    @Param('id') id: string,
    @Body() dto: CreateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkTypeTemplateView> {
    return this.equipmentPlansService.createStageTemplateForWorkType(id, dto);
  }

  @Roles('admin', 'moderator')
  @Post('stage-templates')
  async createGlobalStageTemplate(
    @Body() dto: CreateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkStageTemplateView> {
    return this.equipmentPlansService.createStageTemplate(dto);
  }

  @Roles('admin', 'moderator')
  @Put('stage-templates/:id')
  async updateStageTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateRoadWorkStageTemplateDto,
  ): Promise<RoadWorkStageTemplateView> {
    return this.equipmentPlansService.updateStageTemplate(id, dto);
  }

  @Roles('admin', 'moderator')
  @Delete('stage-templates/:id')
  async removeStageTemplate(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.equipmentPlansService.removeStageTemplate(id);
  }

  @Roles('admin', 'moderator')
  @Post('draft')
  async generateDraft(
    @Body() dto: GenerateEquipmentPlanDraftDto,
  ): Promise<EquipmentPlanDraftView> {
    return this.equipmentPlansService.generateDraft(dto);
  }

  @Roles('admin', 'moderator')
  @Post('apply-draft')
  async applyDraft(
    @Body() dto: ApplyEquipmentPlanDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AppliedEquipmentPlanDraftView> {
    return this.equipmentPlansService.applyDraft(dto, req.user.id);
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
