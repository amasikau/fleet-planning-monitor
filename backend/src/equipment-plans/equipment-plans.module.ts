import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EquipmentPlansController } from './equipment-plans.controller';
import { EquipmentPlansService } from './equipment-plans.service';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentPlansController],
  providers: [EquipmentPlansService],
})
export class EquipmentPlansModule {}
