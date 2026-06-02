import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(dto.username, dto.password, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.authService.logout(req.user.id, token);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async getSession(@Req() req: any) {
    return this.authService.getSession(req.user.id);
  }
}
