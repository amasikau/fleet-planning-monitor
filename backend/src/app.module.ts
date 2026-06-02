import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { FleetModule } from './fleet/fleet.module';
import { ServiceEventsModule } from './service-events/service-events.module';
import { ProfileModule } from './profile/profile.module';
import { SitesModule } from './sites/sites.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EquipmentPlansModule } from './equipment-plans/equipment-plans.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    DriversModule,
    MechanicsModule,
    FleetModule,
    ServiceEventsModule,
    ProfileModule,
    SitesModule,
    EquipmentPlansModule,
    UploadsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
