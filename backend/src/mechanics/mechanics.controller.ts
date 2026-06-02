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
import { MechanicsService } from './mechanics.service';
import { AssignMechanicDto } from './dto/assign-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('mechanics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MechanicsController {
  constructor(private mechanicsService: MechanicsService) {}

  @Roles('admin', 'moderator')
  @Get('audit-log')
  async getAuditLog(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.mechanicsService.getAuditLog({ search, action, from, to });
  }

  @Roles('admin', 'moderator')
  @Get('unassigned')
  async findUnassigned() {
    return this.mechanicsService.findUnassigned();
  }

  @Get()
  async findAll() {
    return this.mechanicsService.findAll();
  }

  @Roles('admin', 'moderator')
  @Post('assign')
  async assign(@Body() dto: AssignMechanicDto, @Req() req: any) {
    return this.mechanicsService.assign(dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateMechanicDto,
    @Req() req: any,
  ) {
    return this.mechanicsService.update(userId, dto, req.user.id);
  }

  @Roles('admin', 'moderator')
  @Delete(':userId/unassign')
  async unassign(@Param('userId') userId: string, @Req() req: any) {
    return this.mechanicsService.unassign(userId, req.user.id);
  }
}
