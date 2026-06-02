import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { requireEnv } from '../config/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  async validate(req: Request, payload: { sub: string; username: string }) {
    const token = req
      .get('authorization')
      ?.replace(/^Bearer\s+/i, '')
      .trim();

    if (!token) {
      throw new UnauthorizedException('Требуется повторный вход в систему');
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt <= new Date() ||
      session.user.status === 'blocked'
    ) {
      throw new UnauthorizedException('Требуется повторный вход в систему');
    }

    return {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
    };
  }
}
