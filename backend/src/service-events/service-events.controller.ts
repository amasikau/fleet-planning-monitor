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

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ vehicleId, status, type, search }, req.user);
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
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.remove(id, req.user);
  }
}
