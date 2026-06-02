import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import {
  AvailableVehicleView,
  ConstructionSiteAuditLogEntry,
  ConstructionSiteDetailView,
  ConstructionSiteView,
  SitesService,
} from './sites.service';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Roles('admin', 'moderator')
  @Get('audit-log')
  async getAuditLog(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ConstructionSiteAuditLogEntry[]> {
    return this.sitesService.getAuditLog({ search, action, from, to });
  }

  @Get('archived')
  async findArchived(): Promise<ConstructionSiteView[]> {
    return this.sitesService.findArchived();
  }

  @Get('available-vehicles')
  async getAvailableVehicles(
    @Query('siteId') siteId?: string,
  ): Promise<AvailableVehicleView[]> {
    return this.sitesService.getAvailableVehicles(siteId);
  }

  @Get()
  async findAll(): Promise<ConstructionSiteView[]> {
    return this.sitesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ConstructionSiteDetailView> {
    return this.sitesService.findOne(id);
  }

  @Roles('admin', 'moderator')
  @Post()
  async create(
    @Body() dto: CreateSiteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConstructionSiteView> {
    return this.sitesService.create(dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConstructionSiteView> {
    return this.sitesService.update(id, dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.sitesService.remove(id, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConstructionSiteView> {
    return this.sitesService.complete(id, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Post(':id/vehicles')
  async assignVehicle(
    @Param('id') siteId: string,
    @Body('vehicleId') vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.sitesService.assignVehicle(siteId, vehicleId, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Delete(':id/vehicles/:vehicleId')
  async unassignVehicle(
    @Param('id') siteId: string,
    @Param('vehicleId') vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.sitesService.unassignVehicle(siteId, vehicleId, req.user.id);
  }
}
