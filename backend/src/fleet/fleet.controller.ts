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
import {
  FleetAuditLogEntry,
  FleetService,
  FleetVehicleView,
} from './fleet.service';
import { CreateFleetVehicleDto } from './dto/create-fleet-vehicle.dto';
import { UpdateFleetVehicleDto } from './dto/update-fleet-vehicle.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Roles('admin', 'user')
  @Get('audit-log')
  async getAuditLog(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<FleetAuditLogEntry[]> {
    return this.fleetService.getAuditLog({ search, action, from, to });
  }

  @Get()
  async findAll(): Promise<FleetVehicleView[]> {
    return this.fleetService.findAll();
  }

  @Roles('admin', 'user')
  @Post()
  async create(
    @Body() dto: CreateFleetVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FleetVehicleView> {
    return this.fleetService.create(dto, req.user.id);
  }

  @Roles('admin', 'user')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFleetVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FleetVehicleView> {
    return this.fleetService.update(id, dto, req.user.id);
  }

  @Roles('admin', 'user')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.fleetService.remove(id, req.user.id);
  }
}
