import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelectWithoutPassword = {
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
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: userSelectWithoutPassword,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto, performedById: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(
        'Пользователь с таким логином уже существует',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: userSelectWithoutPassword,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'create',
        targetUserId: user.id,
        performedById,
        details: `Создан пользователь ${dto.username}`,
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, performedById: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Пользователь не найден');
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelectWithoutPassword,
    });

    const changes: string[] = [];
    if (dto.lastName || dto.firstName || dto.middleName) changes.push('ФИО');
    if (dto.role) changes.push('роль');
    if (dto.position) changes.push('должность');
    if (dto.password) changes.push('пароль');

    await this.prisma.auditLog.create({
      data: {
        action: 'edit',
        targetUserId: id,
        performedById,
        details: `Изменены данные пользователя: ${changes.join(', ')}`,
      },
    });

    return user;
  }

  async remove(id: string, performedById: string) {
    if (id === performedById) {
      throw new BadRequestException('Нельзя удалить самого себя');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'delete',
        targetUserId: id,
        performedById,
        details: `Удалён пользователь ${existing.username}`,
      },
    });

    await this.prisma.user.delete({ where: { id } });

    return { success: true };
  }

  async toggleBlock(id: string, performedById: string) {
    if (id === performedById) {
      throw new BadRequestException('Нельзя заблокировать самого себя');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Пользователь не найден');
    }

    const newStatus = existing.status === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'blocked' ? 'block' : 'unblock';

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: userSelectWithoutPassword,
    });

    await this.prisma.auditLog.create({
      data: {
        action: action as any,
        targetUserId: id,
        performedById,
        details:
          newStatus === 'blocked'
            ? `Пользователь ${existing.username} заблокирован`
            : `Пользователь ${existing.username} разблокирован`,
      },
    });

    return user;
  }

  async getAuditLog(query: {
    search?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        targetUser: { select: { username: true } },
        performedBy: { select: { username: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    let result = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      targetUser: log.targetUser.username,
      performedBy: log.performedBy.username,
      details: log.details,
    }));

    if (query.search) {
      const s = query.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.targetUser.toLowerCase().includes(s) ||
          r.performedBy.toLowerCase().includes(s) ||
          r.details.toLowerCase().includes(s),
      );
    }

    return result;
  }
}
