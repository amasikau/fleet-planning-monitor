import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceEventsService } from './service-events.service';
import type { AuthUser } from './service-events.service';
import { CreateServiceEventDto } from './dto/create-service-event.dto';
import { CreateRepairTemplateDto } from './dto/create-repair-template.dto';
import { UpdateRepairTemplateDto } from './dto/update-repair-template.dto';
import { UpdateServiceEventDto } from './dto/update-service-event.dto';

interface AuthenticatedRequest {
  user: AuthUser;
}

@Controller('service-events')
@UseGuards(JwtAuthGuard)
export class ServiceEventsController {
  constructor(private readonly service: ServiceEventsService) {}

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('repair-templates')
  async getRepairTemplates(
    @Query('vehicleType') vehicleType?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.getRepairTemplates({ vehicleType, includeInactive });
  }

  @Post('repair-templates')
  async createRepairTemplate(@Body() dto: CreateRepairTemplateDto) {
    return this.service.createRepairTemplate(dto);
  }

  @Put('repair-templates/:id')
  async updateRepairTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateRepairTemplateDto,
  ) {
    return this.service.updateRepairTemplate(id, dto);
  }

  @Delete('repair-templates/:id')
  async removeRepairTemplate(@Param('id') id: string) {
    return this.service.removeRepairTemplate(id);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ vehicleId, status, type, search });
  }

  @Post()
  async create(
    @Body() dto: CreateServiceEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
