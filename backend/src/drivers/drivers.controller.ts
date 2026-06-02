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
import { DriversService } from './drivers.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Roles('admin', 'moderator')
  @Get('audit-log')
  async getAuditLog(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.driversService.getAuditLog({ search, action, from, to });
  }

  @Roles('admin', 'moderator')
  @Get('unassigned')
  async findUnassigned() {
    return this.driversService.findUnassigned();
  }

  @Get()
  async findAll() {
    return this.driversService.findAll();
  }

  @Roles('admin', 'moderator')
  @Post('assign')
  async assign(@Body() dto: AssignDriverDto, @Req() req: any) {
    return this.driversService.assign(dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: any,
  ) {
    return this.driversService.update(userId, dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Delete(':userId/unassign')
  async unassign(@Param('userId') userId: string, @Req() req: any) {
    return this.driversService.unassign(userId, req.user.id);
  }
}
