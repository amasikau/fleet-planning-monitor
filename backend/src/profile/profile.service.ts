import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const profileSelect = {
  id: true,
  username: true,
  lastName: true,
  firstName: true,
  middleName: true,
  role: true,
  position: true,
  status: true,
  avatar: true,
  isOnline: true,
  createdAt: true,
};

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });
    if (!user) {
      throw new UnauthorizedException('Требуется повторный вход в систему');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const username = dto.username.trim();
      const existing = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException(
          'Пользователь с таким логином уже существует',
        );
      }

      dto = { username };
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: profileSelect,
    });
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Требуется повторный вход в систему');
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Текущий пароль указан неверно');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }
}
