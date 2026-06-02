import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.status === 'blocked') {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        ip,
        userAgent,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'login',
        targetUserId: user.id,
        performedById: user.id,
        details: `Вход в систему с IP ${ip}`,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      user: { ...userWithoutPassword, isOnline: true },
    };
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({ where: { token } });

    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'logout',
        targetUserId: userId,
        performedById: userId,
        details: 'Выход из системы',
      },
    });

    return { success: true };
  }

  async getSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Требуется повторный вход в систему');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
